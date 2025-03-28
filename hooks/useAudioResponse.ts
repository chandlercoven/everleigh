import { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceSettings, AudioResponseHook } from '../types';

/**
 * Custom hook to manage audio responses
 */
const useAudioResponse = (voiceSettings: VoiceSettings): AudioResponseHook => {
  // State to track if audio is currently playing
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Reference to the audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element on mount
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Set up event listeners
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
      });
    }
    
    // Clean up event listeners on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => {
          setIsPlaying(false);
        });
        
        audioRef.current.removeEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
        });
      }
    };
  }, []);
  
  // Update audio settings when voice settings change
  useEffect(() => {
    if (audioRef.current) {
      // Set volume
      audioRef.current.volume = voiceSettings.volume;
      
      // Note: speech rate and pitch can't be set directly on Audio elements
      // These would be applied when requesting the audio from the TTS service
    }
  }, [voiceSettings]);
  
  /**
   * Play audio response for the given text
   */
  const playAudioResponse = useCallback(async (text: string): Promise<void> => {
    try {
      if (!text || !text.trim()) {
        console.warn('Empty text provided for audio response');
        return;
      }
      
      setIsPlaying(true);
      
      // Prepare request parameters
      const params = new URLSearchParams({
        text,
        voice: voiceSettings.voice,
        speed: String(voiceSettings.speed),
        pitch: String(voiceSettings.pitch),
        volume: String(voiceSettings.volume),
        emotion: voiceSettings.emotion || 'neutral'
      });
      
      // Request audio from the TTS API
      const response = await fetch(`/api/tts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get audio response (${response.status})`);
      }
      
      // Get audio URL from response
      const data = await response.json();
      const audioUrl = data.audioUrl || data.url;
      
      if (!audioUrl) {
        throw new Error('No audio URL returned from TTS service');
      }
      
      // Set audio source and play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
      setIsPlaying(false);
      throw error;
    }
  }, [voiceSettings]);
  
  /**
   * Stop audio playback
   */
  const stopAudio = useCallback((): void => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);
  
  return {
    playAudioResponse,
    isPlaying,
    stopAudio
  };
};

export default useAudioResponse; 