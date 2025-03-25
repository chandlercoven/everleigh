import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage enhanced animation states for the voice assistant UI
 * Provides animations, visual states, and haptic feedback patterns
 */
const useAnimatedAssistant = (state = {}) => {
  // Extract state or set defaults
  const {
    isRecording = false,
    isProcessing = false,
    isSpeaking = false,
    currentAudioWaveform = null,
    voiceVolume = 0,
    hapticFeedbackEnabled = true
  } = state;

  // Track previous state to detect transitions
  const [prevState, setPrevState] = useState({
    isRecording,
    isProcessing,
    isSpeaking
  });

  // Animation states mapping
  const animationState = {
    idle: !isRecording && !isProcessing && !isSpeaking,
    listening: isRecording,
    thinking: isProcessing,
    speaking: isSpeaking
  };

  // Determine current animation state name for use in UI
  const currentState = Object.keys(animationState).find(
    key => animationState[key]
  ) || 'idle';

  // Generate dynamic animation properties based on current state
  const getAnimationProps = useCallback(() => {
    if (animationState.listening) {
      return {
        amplitude: Math.min(0.3 + (voiceVolume * 0.7), 1), // Responsive to voice volume
        color: 'primary',
        pulseSpeed: 'fast',
        particleCount: 12,
        particleSpeed: 0.8,
        scale: 1.05,
        glow: true,
        patternType: 'reactive'
      };
    }
    
    if (animationState.thinking) {
      return {
        amplitude: 0.3,
        color: 'secondary',
        pulseSpeed: 'medium',
        particleCount: 8,
        particleSpeed: 0.5,
        patternType: 'circular',
        scale: 1,
        rotation: true
      };
    }
    
    if (animationState.speaking) {
      return {
        amplitude: 0.5,
        color: 'accent',
        pulseSpeed: 'variable',
        particleCount: 16,
        particleSpeed: 0.6,
        scale: 1.05,
        glow: true,
        patternType: 'waveform',
        waveformData: currentAudioWaveform
      };
    }
    
    // Idle state
    return {
      amplitude: 0.1,
      color: 'neutral',
      pulseSpeed: 'slow',
      particleCount: 6,
      particleSpeed: 0.2,
      patternType: 'ambient',
      scale: 1,
      glow: false
    };
  }, [
    animationState.listening, 
    animationState.thinking, 
    animationState.speaking, 
    voiceVolume, 
    currentAudioWaveform
  ]);

  // Generate haptic feedback pattern for state transitions
  const getHapticPattern = useCallback((fromState, toState) => {
    if (fromState === 'idle' && toState === 'listening') {
      return [10, 0, 5]; // Short "ready" pulse
    }
    
    if (fromState === 'listening' && toState === 'thinking') {
      return [5, 10, 5]; // "Processing" pattern
    }
    
    if (toState === 'speaking') {
      return [10, 5, 20]; // "Response ready" pattern
    }
    
    if (fromState === 'speaking' && toState === 'idle') {
      return [5, 5, 5]; // "Finished" pattern
    }
    
    return [5]; // Default subtle feedback
  }, []);

  // Track state transitions and trigger haptic feedback if enabled
  useEffect(() => {
    const prevStateName = Object.keys(animationState).find(
      key => prevState[key]
    ) || 'idle';
    
    // Only trigger on state change
    if (prevStateName !== currentState) {
      // Generate and trigger haptic feedback
      if (hapticFeedbackEnabled && window.navigator.vibrate) {
        const pattern = getHapticPattern(prevStateName, currentState);
        try {
          window.navigator.vibrate(pattern);
        } catch (error) {
          console.error('Haptic feedback failed:', error);
        }
      }
      
      // Update previous state
      setPrevState({
        isRecording,
        isProcessing,
        isSpeaking
      });
    }
  }, [
    currentState, 
    hapticFeedbackEnabled, 
    getHapticPattern, 
    isRecording, 
    isProcessing, 
    isSpeaking, 
    prevState
  ]);

  // Helper to get animation CSS keyframes for a specific animation type
  const getAnimationKeyframes = useCallback((type) => {
    switch (type) {
      case 'pulse':
        return `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
          }
        `;
      case 'wave':
        return `
          @keyframes wave {
            0% { transform: translateY(0); }
            25% { transform: translateY(-10px); }
            50% { transform: translateY(0); }
            75% { transform: translateY(10px); }
            100% { transform: translateY(0); }
          }
        `;
      case 'rotation':
        return `
          @keyframes rotation {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
      case 'glow':
        return `
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(var(--color-rgb), 0.5); }
            50% { box-shadow: 0 0 20px rgba(var(--color-rgb), 0.8); }
            100% { box-shadow: 0 0 5px rgba(var(--color-rgb), 0.5); }
          }
        `;
      default:
        return '';
    }
  }, []);

  // Get CSS animations based on current state
  const getStateAnimations = useCallback(() => {
    const props = getAnimationProps();
    const animations = [];
    
    if (props.glow) {
      animations.push({
        name: 'glow',
        duration: '2s',
        timing: 'ease-in-out',
        iteration: 'infinite',
        keyframes: getAnimationKeyframes('glow')
      });
    }
    
    if (props.rotation) {
      animations.push({
        name: 'rotation',
        duration: '10s',
        timing: 'linear',
        iteration: 'infinite',
        keyframes: getAnimationKeyframes('rotation')
      });
    }
    
    if (props.patternType === 'reactive' || props.patternType === 'waveform') {
      animations.push({
        name: 'wave',
        duration: '1.5s',
        timing: 'ease-in-out',
        iteration: 'infinite',
        keyframes: getAnimationKeyframes('wave')
      });
    }
    
    return animations;
  }, [getAnimationProps, getAnimationKeyframes]);

  return {
    animationState,
    currentState,
    animationProps: getAnimationProps(),
    stateAnimations: getStateAnimations(),
    getHapticPattern
  };
};

export default useAnimatedAssistant; 