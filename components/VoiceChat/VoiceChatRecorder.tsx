// VoiceChatRecorder component - handles audio recording functionality
import React, { useRef, useState, useEffect } from 'react';
import { useVoiceChatStore, usePreferencesStore } from '../../lib/store';

/**
 * Audio feedback object interface
 */
interface AudioFeedback {
  startRecording: HTMLAudioElement;
  stopRecording: HTMLAudioElement;
  error: HTMLAudioElement;
  success: HTMLAudioElement;
}

/**
 * VoiceChatRecorder - Component for recording and processing voice input
 * Handles microphone access, audio recording, and transcription
 */
const VoiceChatRecorder: React.FC = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioFeedbackRef = useRef<AudioFeedback | null>(null);
  
  // Use the Zustand store for state management
  const {
    isRecording,
    isProcessing,
    error,
    setIsRecording,
    setIsProcessing,
    setMessage,
    setError,
    clearError,
    processMessage
  } = useVoiceChatStore();
  
  // Get theme and user preferences
  const { theme, uiPreferences } = usePreferencesStore();
  
  const [waveformHeights, setWaveformHeights] = useState<number[]>([0, 0, 0, 0, 0]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  // Animate waveform when recording
  useEffect(() => {
    if (isRecording && !prefersReducedMotion) {
      let animationFrame: number;
      const animateWaveform = () => {
        setWaveformHeights(
          Array(5).fill(0).map(() => Math.max(4, Math.floor(Math.random() * 24)))
        );
        animationFrame = requestAnimationFrame(animateWaveform);
      };
      animationFrame = requestAnimationFrame(animateWaveform);
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [isRecording, prefersReducedMotion]);
  
  // Handle haptic feedback and sound effects
  useEffect(() => {
    // Initialize audio elements for feedback
    if (typeof window !== 'undefined') {
      audioFeedbackRef.current = {
        startRecording: new Audio('/audio/start-recording.mp3'),
        stopRecording: new Audio('/audio/stop-recording.mp3'),
        error: new Audio('/audio/error.mp3'),
        success: new Audio('/audio/success.mp3')
      };
      
      // Preload audio
      Object.values(audioFeedbackRef.current).forEach(audio => {
        audio.load();
        audio.volume = 0.5;
      });
    }
  }, []);
  
  // Effect for haptic feedback on recording state change
  useEffect(() => {
    if (isRecording) {
      // Vibration API for haptic feedback
      if (navigator.vibrate && !prefersReducedMotion) {
        navigator.vibrate(100);
      }
      
      // Sound effect
      if (audioFeedbackRef.current?.startRecording && !prefersReducedMotion) {
        audioFeedbackRef.current.startRecording.play().catch(e => console.error('Error playing audio', e));
      }
    } else if (isRecording === false && mediaRecorderRef.current) {
      // When stopping recording (not initial state)
      
      // Vibration API for haptic feedback - double pulse
      if (navigator.vibrate && !prefersReducedMotion) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Sound effect
      if (audioFeedbackRef.current?.stopRecording && !prefersReducedMotion) {
        audioFeedbackRef.current.stopRecording.play().catch(e => console.error('Error playing audio', e));
      }
    }
  }, [isRecording, prefersReducedMotion]);
  
  // Play error sound when error occurs
  useEffect(() => {
    if (error && audioFeedbackRef.current?.error && !prefersReducedMotion) {
      audioFeedbackRef.current.error.play().catch(e => console.error('Error playing audio', e));
    }
  }, [error, prefersReducedMotion]);
  
  // Start voice recording
  const startRecording = async (): Promise<void> => {
    try {
      // Clear any previous errors
      clearError();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  // Stop voice recording
  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob: Blob): Promise<void> => {
    try {
      // Create a form to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Transcribe the audio
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error(`Transcription failed: ${transcribeResponse.status}`);
      }

      const transcribeData = await transcribeResponse.json();
      const transcribedText = transcribeData.text;
      
      // Set the transcribed message
      setMessage(transcribedText);
      
      // Process the message through the voice chat system
      await processMessage(transcribedText);
    } catch (error: any) {
      console.error('Error processing audio:', error);
      setError(`Failed to process audio: ${error.message}`);
      setIsProcessing(false);
    }
  };
  
  // Button and waveform styling
  const btnClasses = `
    voice-record-btn
    ${isRecording ? 'recording' : ''} 
    ${isProcessing ? 'processing' : ''}
    rounded-full
    p-4
    flex
    items-center
    justify-center
    transition-all
    ${isRecording ? 'bg-red-500' : `bg-${theme === 'dark' ? 'blue-600' : 'blue-500'}`}
    text-white
    shadow-lg
    hover:shadow-xl
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    ${isRecording ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
    disabled:opacity-50
    disabled:cursor-not-allowed
    w-16
    h-16
  `.trim();
  
  return (
    <div className="voice-recorder mt-4 flex flex-col items-center">
      {/* Waveform visualization */}
      {isRecording && (
        <div className="waveform flex items-end space-x-1 mb-4 h-8">
          {waveformHeights.map((height, i) => (
            <div
              key={i}
              className="waveform-bar bg-red-500 w-2 rounded-t-sm animate-pulse"
              style={{ height: `${height}px` }}
            ></div>
          ))}
        </div>
      )}
      
      {/* Recording button */}
      <button
        className={btnClasses}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isProcessing ? (
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isRecording ? (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {/* Status message */}
      {isProcessing && (
        <div className="status-message mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Processing your message...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message mt-4 text-center text-sm text-red-600 dark:text-red-400">
          {error.toString()}
        </div>
      )}
    </div>
  );
};

export default VoiceChatRecorder; 