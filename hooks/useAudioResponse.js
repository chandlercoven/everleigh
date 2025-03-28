import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to manage audio response functionality
 * Handles text-to-speech, voice selection, and audio playback
 */
const useAudioResponse = (voiceSettings) => {
  // State for audio management
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [lastError, setLastError] = useState(null);
  
  // Reference to audio element
  const audioRef = useRef(null);
  
  // Initialize voice options on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          if (data.voices && Array.isArray(data.voices)) {
            setAvailableVoices(data.voices);
            
            // Set default voice from preferences or first available
            if (voiceSettings?.voice && voiceSettings.voice !== 'default') {
              setSelectedVoice(voiceSettings.voice);
            } else if (data.voices.length > 0) {
              setSelectedVoice(data.voices[0].voice_id || data.voices[0].id);
            }
          }
        } else {
          console.error('Error fetching voices:', await response.text());
          setLastError({
            message: 'Could not load voice options',
            type: 'network_error',
            details: `Status: ${response.status}`
          });
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setLastError({
          message: 'Could not load voice options',
          type: 'network_error',
          details: error.message
        });
      }
    };

    fetchVoices();
  }, [voiceSettings?.voice]);
  
  // Initialize audio element on mount
  useEffect(() => {
    // Clean up function to handle audio resources
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, []);
  
  // Play audio response from text
  const playAudioResponse = async (text) => {
    if (!text || !selectedVoice || !voiceSettings?.enabled) return;
    
    try {
      setIsSpeaking(true);
      setLastError(null);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice,
          model_id: voiceSettings?.model || 'eleven_monolingual_v1'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Text-to-speech API returned ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
          console.error('Error playing audio:', e);
          setLastError({
            message: 'Could not play audio response',
            type: 'audio_error',
            details: e.message
          });
        });
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setLastError({
        message: 'Could not generate speech',
        type: 'tts_error',
        details: error.message
      });
    } finally {
      setIsSpeaking(false);
    }
  };
  
  // Stop current audio playback
  const stopAudioResponse = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };
  
  return {
    isSpeaking,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    playAudioResponse,
    stopAudioResponse,
    audioRef,
    lastError
  };
};

export default useAudioResponse; 