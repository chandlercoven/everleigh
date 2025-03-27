import React, { useEffect, useState, useRef } from 'react';
import { usePreferencesStore } from '../../lib/store';

/**
 * VoiceVisualizer - Displays audio levels and recording status visually
 * 
 * @param {Object} props
 * @param {boolean} props.isActive - Whether the visualizer is active
 * @param {number} props.audioLevel - Audio level between 0 and 1
 * @param {string} props.status - Current status (idle, requesting_permission, recording, processing, error)
 * @param {string} props.theme - UI theme (light/dark)
 * @param {string} props.size - Size of the visualizer (sm, md, lg)
 */
const VoiceVisualizer = ({ 
  isActive = false, 
  audioLevel = 0,
  status = 'idle',
  theme = 'light',
  size = 'md' 
}) => {
  const [bars, setBars] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const { uiPreferences } = usePreferencesStore();
  const frameRef = useRef(null);
  const visualizerRef = useRef(null);
  
  // Determine bar count and visualizer size
  const barCount = size === 'sm' ? 3 : size === 'lg' ? 7 : 5;
  const visualizerSize = size === 'sm' ? 'h-12 w-12' : size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';
  const barWidth = size === 'sm' ? 'w-1' : size === 'lg' ? 'w-2' : 'w-1.5';
  const gapSize = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-2' : 'gap-1.5';
  
  // Setup animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Generate bars with heights based on activity and audio level
  const generateBars = () => {
    if (!isActive) {
      // Inactive state - flat bars
      return Array(barCount).fill().map((_, i) => (
        <div 
          key={i}
          className={`${barWidth} h-1 bg-gray-300 dark:bg-gray-700 rounded-full transition-all duration-150`}
        />
      ));
    }
    
    // For active state, create varying heights based on audio level
    return Array(barCount).fill().map((_, i) => {
      // Create a custom height for each bar
      // Center bars are taller than outer bars when audio level is high
      const position = i - Math.floor(barCount / 2);
      const positionFactor = 1 - Math.min(1, Math.abs(position) / (barCount / 2)) * 0.5;
      
      // Add some randomness for a more natural look
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      // Calculate height (in pixels)
      const heightScale = size === 'sm' ? 24 : size === 'lg' ? 48 : 32;
      const height = Math.max(4, Math.round(audioLevel * positionFactor * randomFactor * heightScale));
      
      return (
        <div 
          key={i}
          className={`${barWidth} bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-75`}
          style={{ height: `${height}px` }}
        />
      );
    });
  };
  
  // Determine icon and status text
  const getStatusInfo = () => {
    switch(status) {
      case 'requesting_permission':
        return {
          icon: '🎤',
          text: 'Requesting microphone access...',
          color: 'text-yellow-500 dark:text-yellow-400'
        };
      case 'recording':
        return {
          icon: '🔴',
          text: 'Recording...',
          color: 'text-red-500 dark:text-red-400'
        };
      case 'processing':
        return {
          icon: '⏳',
          text: 'Processing...',
          color: 'text-blue-500 dark:text-blue-400'
        };
      case 'error':
        return {
          icon: '⚠️',
          text: 'Error',
          color: 'text-red-500 dark:text-red-400'
        };
      default:
        return {
          icon: '🎙️',
          text: 'Ready',
          color: 'text-gray-500 dark:text-gray-400'
        };
    }
  };
  
  const { icon, text, color } = getStatusInfo();
  
  return (
    <div className="voice-visualizer flex flex-col items-center">
      {/* Status indicator above the visualizer */}
      {status !== 'idle' && (
        <div className={`mb-2 text-sm ${color} font-medium flex items-center`}>
          <span className="mr-1">{icon}</span>
          <span>{text}</span>
        </div>
      )}
      
      {/* Main visualizer */}
      <div className={`relative ${visualizerSize} flex items-center justify-center`}>
        {/* Circular background */}
        <div 
          className={`
            absolute inset-0 rounded-full 
            ${isActive 
              ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
              : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}
            transition-colors duration-300
          `}
        />
        
        {/* Bars container */}
        <div className={`relative flex items-center ${gapSize} h-1/2`}>
          {generateBars()}
        </div>
        
        {/* Pulse animation for requesting or processing states */}
        {(status === 'requesting_permission' || status === 'processing') && (
          <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-75"></div>
        )}
      </div>
    </div>
  );
};

export default VoiceVisualizer; 