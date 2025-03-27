import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for voice recording functionality
 * Handles microphone access, recording, and provides audio level data
 */
const useVoiceRecording = ({ 
  onData, 
  onError,
  audioConfig = {
    sampleRate: 44100,
    channels: 1,
    mimeType: 'audio/webm'
  }
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Refs for recording state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);
  
  // Release resources on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      
      // Clean up audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error('Error closing AudioContext:', e));
      }
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Initialize audio analyzer for level detection
  const initAudioAnalyzer = useCallback((stream) => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported in this browser');
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
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
    }
  }, []);
  
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
      return 0;
    }
  }, [isRecording]);
  
  // Check for microphone permissions
  const checkPermissions = useCallback(async () => {
    try {
      // Check if we can access user media
      const result = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission is granted, but we can release this stream
      result.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error checking microphone permissions:', error);
      setPermissionGranted(false);
      if (onError) {
        onError(new Error('Microphone access denied. Please grant permission.'));
      }
      return false;
    }
  }, [onError]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    // First, ensure we have permissions
    if (!permissionGranted) {
      const hasPermission = await checkPermissions();
      if (!hasPermission) return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Initialize audio analyzer for levels
      initAudioAnalyzer(stream);
      
      // Create media recorder
      const options = { mimeType: audioConfig.mimeType };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Reset chunks
      audioChunksRef.current = [];
      
      // Setup event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: audioConfig.mimeType 
        });
        
        // Notify parent component
        if (onData) {
          onData(audioBlob);
        }
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsRecording(false);
        audioChunksRef.current = [];
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [permissionGranted, checkPermissions, initAudioAnalyzer, onData, onError, audioConfig.mimeType]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);
  
  // Provide state and functions
  return {
    isRecording,
    permissionGranted,
    audioLevel,
    startRecording,
    stopRecording,
    getAudioLevel,
    checkPermissions
  };
};

export default useVoiceRecording; 