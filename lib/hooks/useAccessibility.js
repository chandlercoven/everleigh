import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing accessibility features
 * Handles user preferences for reduced motion, contrast, etc.
 * 
 * @param {Object} initialSettings - Initial accessibility settings
 * @returns {Object} Accessibility settings and update functions
 */
const useAccessibility = (initialSettings = {}) => {
  // Default settings
  const defaultSettings = {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    useSystemPreferences: true,
    keyboardNavigationEnabled: true,
    hapticFeedback: true,
  };
  
  // Merge initial settings with defaults
  const [settings, setSettings] = useState({ 
    ...defaultSettings, 
    ...initialSettings
  });
  
  // Detect system preferences initially and on change
  useEffect(() => {
    if (!settings.useSystemPreferences) return;
    
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = (query) => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: query.matches,
      }));
    };
    
    // Check for contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    const updateContrastPreference = (query) => {
      setSettings(prev => ({
        ...prev,
        highContrast: query.matches,
      }));
    };
    
    // Initial check
    updateMotionPreference(motionQuery);
    updateContrastPreference(contrastQuery);
    
    // Add event listeners for changes
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', updateMotionPreference);
      contrastQuery.addEventListener('change', updateContrastPreference);
    } else {
      // Fallback for older browsers
      motionQuery.addListener(updateMotionPreference);
      contrastQuery.addListener(updateContrastPreference);
    }
    
    // Cleanup event listeners
    return () => {
      if (typeof motionQuery.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', updateMotionPreference);
        contrastQuery.removeEventListener('change', updateContrastPreference);
      } else {
        // Fallback for older browsers
        motionQuery.removeListener(updateMotionPreference);
        contrastQuery.removeListener(updateContrastPreference);
      }
    };
  }, [settings.useSystemPreferences]);
  
  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);
  
  // Toggle a boolean setting
  const toggleSetting = useCallback((key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);
  
  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);
  
  // Generate class names for components
  const getAccessibilityClass = useCallback(() => {
    const classes = [];
    
    if (settings.highContrast) classes.push('high-contrast');
    if (settings.reducedMotion) classes.push('reduced-motion');
    if (settings.largeText) classes.push('large-text');
    
    return classes.join(' ');
  }, [settings.highContrast, settings.reducedMotion, settings.largeText]);
  
  // Get styles for reduced motion
  const getReducedMotionStyles = useCallback(() => {
    if (!settings.reducedMotion) return {};
    
    return {
      animation: 'none !important',
      transition: 'none !important',
    };
  }, [settings.reducedMotion]);
  
  // Get styles for high contrast
  const getHighContrastStyles = useCallback(() => {
    if (!settings.highContrast) return {};
    
    return {
      // High contrast mode styles
      // These would be applied to elements that need higher contrast
      color: '#ffffff',
      backgroundColor: '#000000',
      border: '1px solid #ffffff',
    };
  }, [settings.highContrast]);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!settings.keyboardNavigationEnabled) return;
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    };
    
    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-nav');
    };
    
    // Add event listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [settings.keyboardNavigationEnabled]);
  
  // Get ARIA attributes for components
  const getAriaAttributes = useCallback((componentType) => {
    const baseAttributes = {};
    
    // Add more specific ARIA attributes based on component type
    switch (componentType) {
      case 'voiceButton':
        return {
          ...baseAttributes,
          'aria-label': 'Start voice recording',
          'role': 'button',
        };
      case 'suggestionChip':
        return {
          ...baseAttributes,
          'role': 'button',
        };
      case 'conversationLog':
        return {
          ...baseAttributes,
          'role': 'log',
          'aria-live': 'polite',
          'aria-relevant': 'additions',
        };
      default:
        return baseAttributes;
    }
  }, []);
  
  // Trigger haptic feedback if supported and enabled
  const triggerHapticFeedback = useCallback((pattern = 'default') => {
    if (!settings.hapticFeedback || !window.navigator.vibrate) return false;
    
    const patterns = {
      default: [10],
      success: [10, 50, 10],
      error: [100],
      warning: [10, 30, 10, 30, 10],
      recording: [5],
    };
    
    const vibrationPattern = patterns[pattern] || patterns.default;
    
    try {
      window.navigator.vibrate(vibrationPattern);
      return true;
    } catch (error) {
      console.error('Haptic feedback error:', error);
      return false;
    }
  }, [settings.hapticFeedback]);
  
  return {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings,
    getAccessibilityClass,
    getReducedMotionStyles,
    getHighContrastStyles,
    getAriaAttributes,
    triggerHapticFeedback,
  };
};

export default useAccessibility; 