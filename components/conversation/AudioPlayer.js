import React, { useEffect } from 'react';
import { useVoiceChat } from '../../contexts/VoiceChatContext';

/**
 * AudioPlayer - Component for handling audio playback
 * Uses VoiceChatContext for state management instead of props
 */
const AudioPlayer = () => {
  const { audioResponse } = useVoiceChat();
  const { audioRef, setIsSpeaking } = audioResponse;
  
  useEffect(() => {
    // Initialize audio element
    const audioElement = new Audio();
    audioRef.current = audioElement;
    
    // Set up event listeners
    const handleEnded = () => {
      setIsSpeaking(false);
    };
    
    const handleError = (error) => {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
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
  }, [audioRef, setIsSpeaking]);
  
  return null; // This component doesn't render anything visible
};

export default AudioPlayer; 