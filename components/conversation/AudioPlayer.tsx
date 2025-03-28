import React, { useEffect, useRef } from 'react';
import { useVoiceChat } from '../../contexts/VoiceChatContext';

/**
 * AudioPlayer - Component for handling audio playback
 * Uses VoiceChatContext for state management instead of props
 */
const AudioPlayer: React.FC = () => {
  const { audioResponse } = useVoiceChat();
  const { isPlaying, stopAudio } = audioResponse;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initialize audio element
    const audioElement = new Audio();
    audioRef.current = audioElement;
    
    // Set up event listeners
    const handleEnded = () => {
      // We can't directly use setIsSpeaking, but we can call stopAudio
      stopAudio();
    };
    
    const handleError = (error: Event) => {
      console.error('Audio playback error:', error);
      stopAudio();
    };
    
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    
    // Cleanup
    return () => {
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      
      // Stop any playing audio
      if (audioElement) {
        audioElement.pause();
        if (audioElement.src) {
          URL.revokeObjectURL(audioElement.src);
        }
      }
    };
  }, [stopAudio]);
  
  return null; // This component doesn't render anything visible
};

export default AudioPlayer; 