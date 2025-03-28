import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingStatus, VoiceRecordingHook, VoiceRecordingOptions } from '../types';

/**
 * Hook for managing voice recording with MediaRecorder API
 */
const useVoiceRecording = (options: VoiceRecordingOptions): VoiceRecordingHook => {
  // State
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('inactive');
  
  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Debug mode
  const debug = options.debug || false;
  
  /**
   * Clean up resources
   */
  const cleanupResources = useCallback(() => {
    // Stop any active media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Reset references
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    audioChunksRef.current = [];
  }, []);
  
  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);
  
  /**
   * Set up audio analyzer for volume level metering
   */
  const setupAudioAnalyzer = useCallback((stream: MediaStream) => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create analyzer
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Connect stream to analyzer
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start analyzing
      const analyzeAudio = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedLevel = average / 255;
        
        audioLevelRef.current = normalizedLevel;
        
        // Continue analyzing
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };
      
      analyzeAudio();
    } catch (error) {
      console.error('Error setting up audio analyzer:', error);
    }
  }, []);
  
  /**
   * Check microphone permissions
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices API not available in this browser');
      }
      
      // Try to get user media to check/request permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop tracks immediately - we're just checking permissions
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      if (debug) {
        console.error('Permission check error:', error);
      }
      
      // Check specific error types
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        if (options.onStatusChange) {
          options.onStatusChange('error', { type: 'permission_denied', message: 'Microphone permission denied' });
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        if (options.onStatusChange) {
          options.onStatusChange('error', { type: 'device_not_found', message: 'No microphone found' });
        }
      }
      
      return false;
    }
  }, [debug, options]);
  
  /**
   * Start recording audio
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Reset chunks
      audioChunksRef.current = [];
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analyzer
      setupAudioAnalyzer(stream);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          // Create blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Log debug info
          if (debug) {
            console.log(`Recording stopped. Blob size: ${audioBlob.size}, type: ${audioBlob.type}`);
          }
          
          // Call the onData callback with the audio blob
          if (options.onData) {
            options.onData(audioBlob);
          }
          
          // Reset for next recording
          audioChunksRef.current = [];
          setRecordingStatus('inactive');
          
          if (options.onStatusChange) {
            options.onStatusChange('inactive');
          }
        } catch (error) {
          console.error('Error processing recorded audio:', error);
          
          if (options.onStatusChange) {
            options.onStatusChange('error', { 
              type: 'processing_error', 
              message: error instanceof Error ? error.message : 'Error processing audio' 
            });
          }
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        
        if (options.onError) {
          options.onError(new Error('Recording error'));
        }
        
        if (options.onStatusChange) {
          options.onStatusChange('error', { 
            type: 'recorder_error', 
            message: 'Error occurred during recording' 
          });
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      setRecordingStatus('recording');
      
      if (options.onStatusChange) {
        options.onStatusChange('recording');
      }
      
      if (debug) {
        console.log('Recording started');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      
      setRecordingStatus('error');
      
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Failed to start recording'));
      }
      
      if (options.onStatusChange) {
        options.onStatusChange('error', { 
          type: 'startup_error', 
          message: error instanceof Error ? error.message : 'Failed to start recording' 
        });
      }
      
      cleanupResources();
    }
  }, [cleanupResources, debug, options, setupAudioAnalyzer]);
  
  /**
   * Stop recording audio
   */
  const stopRecording = useCallback((): void => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        if (debug) {
          console.log('Recording stopping...');
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Failed to stop recording'));
      }
    } finally {
      // Clean up resources regardless of success/failure
      cleanupResources();
    }
  }, [cleanupResources, debug, options]);
  
  /**
   * Pause recording audio
   */
  const pauseRecording = useCallback((): void => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        setRecordingStatus('paused');
        
        if (options.onStatusChange) {
          options.onStatusChange('paused');
        }
        
        if (debug) {
          console.log('Recording paused');
        }
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  }, [debug, options]);
  
  /**
   * Resume recording audio
   */
  const resumeRecording = useCallback((): void => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        setRecordingStatus('recording');
        
        if (options.onStatusChange) {
          options.onStatusChange('recording');
        }
        
        if (debug) {
          console.log('Recording resumed');
        }
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  }, [debug, options]);
  
  /**
   * Get current audio level (0-1)
   */
  const getAudioLevel = useCallback((): number => {
    return audioLevelRef.current;
  }, []);
  
  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getAudioLevel,
    recordingStatus,
    checkPermissions
  };
};

export default useVoiceRecording; 