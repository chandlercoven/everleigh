import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for voice recording functionality
 * Handles microphone access, recording, and provides audio level data
 */
const useVoiceRecording = ({ 
  onData, 
  onError,
  onStatusChange, // New callback for detailed status updates
  audioConfig = {
    sampleRate: 44100,
    channels: 1,
    mimeType: 'audio/webm'
  },
  debug = false // Debug mode for verbose logging
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // New state for detailed status
  
  // Refs for recording state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);
  
  // Log function that only works in debug mode
  const logDebug = useCallback((...args) => {
    if (debug) {
      console.log('[VoiceRecording]', ...args);
    }
  }, [debug]);

  // Update status and trigger callback
  const updateStatus = useCallback((status, details = null) => {
    logDebug('Status update:', status, details);
    setRecordingStatus(status);
    if (onStatusChange) {
      onStatusChange(status, details);
    }
  }, [onStatusChange, logDebug]);
  
  // Release resources on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      
      // Clean up audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => {
          logDebug('Error closing AudioContext:', e);
        });
      }
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        logDebug('Media stream tracks stopped');
      }
    };
  }, [logDebug]);
  
  // Initialize audio analyzer for level detection
  const initAudioAnalyzer = useCallback((stream) => {
    try {
      logDebug('Initializing audio analyzer');
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        const error = new Error('AudioContext not supported in this browser');
        updateStatus('error', { message: error.message, type: 'browser_support' });
        console.warn(error.message);
        return;
      }
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Set up data array for levels
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      logDebug('Audio analyzer initialized successfully');
      updateStatus('analyzer_ready');
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
      updateStatus('error', { 
        message: error.message, 
        type: 'analyzer_initialization',
        details: error.toString()
      });
    }
  }, [logDebug, updateStatus]);
  
  // Get current audio level (0-1 range)
  const getAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isRecording) {
      return 0;
    }
    
    try {
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate average level
      let sum = 0;
      const data = dataArrayRef.current;
      
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      
      const average = sum / data.length;
      
      // Normalize to 0-1 range (with some adjustment to make it more sensitive)
      const level = Math.min(1, Math.max(0, average / 128));
      setAudioLevel(level);
      
      return level;
    } catch (error) {
      console.error('Error getting audio level:', error);
      updateStatus('error', { 
        message: error.message, 
        type: 'audio_level_calculation',
        details: error.toString()
      });
      return 0;
    }
  }, [isRecording, updateStatus]);
  
  // Check for microphone permissions
  const checkPermissions = useCallback(async () => {
    try {
      updateStatus('requesting_permission');
      logDebug('Checking microphone permissions');
      
      // Check if we can access user media
      const result = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission is granted, but we can release this stream
      result.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      updateStatus('permission_granted');
      logDebug('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Error checking microphone permissions:', error);
      setPermissionGranted(false);
      
      let errorType = 'unknown';
      let errorMessage = error.message || 'Microphone access denied. Please grant permission.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorType = 'permission_denied';
        errorMessage = 'Microphone access was denied. Please grant permission in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorType = 'device_not_found';
        errorMessage = 'No microphone was found on your device. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorType = 'device_in_use';
        errorMessage = 'Your microphone is in use by another application. Please close other apps and try again.';
      }
      
      updateStatus('error', { message: errorMessage, type: errorType, details: error.toString() });
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      return false;
    }
  }, [onError, logDebug, updateStatus]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    // First, ensure we have permissions
    if (!permissionGranted) {
      logDebug('Permissions not granted, checking...');
      const hasPermission = await checkPermissions();
      if (!hasPermission) return;
    }
    
    try {
      logDebug('Starting recording');
      updateStatus('starting');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Initialize audio analyzer for levels
      initAudioAnalyzer(stream);
      
      // Create media recorder
      const options = { mimeType: audioConfig.mimeType };
      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
      } catch (mimeError) {
        logDebug('Failed with specified MIME type, trying default');
        // If the specified MIME type fails, try without specifying a MIME type
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
      }
      
      // Reset chunks
      audioChunksRef.current = [];
      
      // Setup event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          logDebug(`Received audio chunk: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        updateStatus('processing');
        logDebug('Recording stopped, processing data');
        
        // Create blob from chunks
        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          const emptyError = new Error('No audio data captured');
          updateStatus('error', { 
            message: emptyError.message, 
            type: 'no_audio_data'
          });
          if (onError) onError(emptyError);
          return;
        }
        
        const audioBlob = new Blob(chunks, { 
          type: mediaRecorderRef.current.mimeType || audioConfig.mimeType 
        });
        
        logDebug(`Created audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Notify parent component
        if (onData) {
          onData(audioBlob);
        }
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsRecording(false);
        updateStatus('completed');
        audioChunksRef.current = [];
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      updateStatus('recording');
      logDebug('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorType = 'unknown';
      let errorMessage = error.message || 'Failed to start recording';
      
      if (error.name === 'NotAllowedError') {
        errorType = 'permission_denied';
      } else if (error.name === 'NotReadableError') {
        errorType = 'device_in_use';
      } else if (error.name === 'NotFoundError') {
        errorType = 'device_not_found';
      }
      
      updateStatus('error', { 
        message: errorMessage, 
        type: errorType,
        details: error.toString()
      });
      
      if (onError) {
        onError(error);
      }
    }
  }, [permissionGranted, checkPermissions, initAudioAnalyzer, onData, onError, audioConfig.mimeType, logDebug, updateStatus]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        logDebug('Stopping recording');
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          updateStatus('stopping');
        }
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        updateStatus('error', { 
          message: error.message, 
          type: 'stop_recording_error',
          details: error.toString()
        });
      }
    } else {
      logDebug('No active recording to stop');
    }
  }, [isRecording, logDebug, updateStatus]);
  
  // Provide state and functions
  return {
    isRecording,
    permissionGranted,
    audioLevel,
    recordingStatus, // New status value
    startRecording,
    stopRecording,
    getAudioLevel,
    checkPermissions
  };
};

export default useVoiceRecording; 