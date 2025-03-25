import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for voice activity detection
 * Uses the Silero VAD model via @ricky0123/vad-web
 */
const useVoiceActivityDetection = ({
  onSpeechStart,
  onSpeechEnd,
  enabled = false,
  autoStart = false,
  minSpeechDuration = 300,
  onError = () => {},
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const vadRef = useRef(null);
  
  // Load the VAD module
  useEffect(() => {
    let isMounted = true;
    
    const loadVAD = async () => {
      try {
        setIsLoading(true);
        
        // Dynamic import to avoid loading the module on server-side
        const { MicVAD } = await import('@ricky0123/vad-web');
        
        if (!isMounted) return;
        
        // Initialize the VAD module
        vadRef.current = await MicVAD.new({
          onSpeechStart: () => {
            if (!isMounted) return;
            onSpeechStart?.();
          },
          onSpeechEnd: (audio) => {
            if (!isMounted) return;
            onSpeechEnd?.(audio);
          },
          minSpeechDuration: minSpeechDuration,
          onVADMisfire: () => {
            // Handle false positives
            console.log('VAD misfire (false positive)');
          }
        });
        
        setIsReady(true);
        setIsLoading(false);
        
        // Auto-start if enabled
        if (autoStart && enabled) {
          startListening();
        }
        
      } catch (error) {
        console.error('Error initializing VAD:', error);
        if (isMounted) {
          setIsLoading(false);
          onError(error);
        }
      }
    };
    
    if (enabled) {
      loadVAD();
    }
    
    return () => {
      isMounted = false;
      // Cleanup
      if (vadRef.current) {
        vadRef.current.pause();
        vadRef.current = null;
      }
    };
  }, [enabled, autoStart, onSpeechStart, onSpeechEnd, minSpeechDuration, onError]);
  
  // Start listening for voice activity
  const startListening = useCallback(() => {
    if (!vadRef.current || !isReady) return false;
    
    try {
      vadRef.current.start();
      setIsListening(true);
      return true;
    } catch (error) {
      console.error('Error starting VAD:', error);
      onError(error);
      return false;
    }
  }, [isReady, onError]);
  
  // Stop listening for voice activity
  const stopListening = useCallback(() => {
    if (!vadRef.current || !isListening) return false;
    
    try {
      vadRef.current.pause();
      setIsListening(false);
      return true;
    } catch (error) {
      console.error('Error stopping VAD:', error);
      onError(error);
      return false;
    }
  }, [isListening, onError]);
  
  // Toggle listening state
  const toggleListening = useCallback(() => {
    return isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);
  
  return {
    isReady,
    isListening,
    isLoading,
    startListening,
    stopListening,
    toggleListening
  };
};

export default useVoiceActivityDetection; 