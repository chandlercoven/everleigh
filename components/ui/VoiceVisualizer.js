import React, { useEffect, useState, useRef } from 'react';
import { usePreferencesStore } from '../../lib/store';

/**
 * VoiceVisualizer - Advanced voice visualization component
 * Provides visual feedback for voice input and output
 */
const VoiceVisualizer = ({ 
  isActive = false, 
  mode = 'listening', // 'listening', 'speaking', 'processing', 'idle'
  audioLevel = 0,
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  const [bars, setBars] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const { uiPreferences } = usePreferencesStore();
  const frameRef = useRef(null);
  const visualizerRef = useRef(null);
  
  // Determine size classes
  const sizeMap = {
    sm: {
      container: 'w-16 h-16',
      bars: 'w-1',
      count: 10
    },
    md: {
      container: 'w-24 h-24',
      bars: 'w-1.5',
      count: 14
    },
    lg: {
      container: 'w-32 h-32',
      bars: 'w-2',
      count: 20
    }
  };
  
  const sizeClass = sizeMap[size] || sizeMap.md;
  
  // Setup animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Generate bars based on mode and audio level
  useEffect(() => {
    if (!isActive && mode === 'idle') {
      setBars(Array(sizeClass.count).fill(1)); // Minimal height when inactive
      return;
    }
    
    if (mode === 'processing') {
      // For processing, generate a "loading" style animation
      const processingBars = Array(sizeClass.count).fill().map((_, i) => ({
        height: 10 + Math.sin((Date.now() / 500) + (i * 0.5)) * 8,
        delay: i * 50
      }));
      setBars(processingBars);
      
      // Continuously update for animation
      frameRef.current = requestAnimationFrame(() => {
        if (mode === 'processing') {
          setBars(processingBars);
        }
      });
      
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }
    
    // Generate random heights for static visualization
    const generateBars = () => {
      const baseLevels = {
        listening: () => {
          // Use audioLevel (0-1) to determine intensity
          // Add some randomness for natural look
          const level = audioLevel * 40;
          return Array(sizeClass.count).fill().map(() => 
            5 + Math.random() * level
          );
        },
        speaking: () => {
          // More pronounced, symmetric pattern for speaking
          return Array(sizeClass.count).fill().map((_, i) => {
            const centerDistance = Math.abs((sizeClass.count - 1) / 2 - i);
            const centerFactor = 1 - (centerDistance / ((sizeClass.count - 1) / 2));
            return 10 + (centerFactor * 30) + (Math.random() * 10 - 5);
          });
        },
        idle: () => Array(sizeClass.count).fill(3)
      };
      
      return baseLevels[mode] ? baseLevels[mode]() : Array(sizeClass.count).fill(1);
    };
    
    // For active modes, continuously update
    if ((mode === 'listening' || mode === 'speaking') && isActive) {
      frameRef.current = requestAnimationFrame(() => {
        setBars(generateBars());
      });
    } else {
      setBars(generateBars());
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isActive, mode, audioLevel, sizeClass.count]);
  
  // Colors based on mode
  const getColorClass = () => {
    const modeColors = {
      listening: 'from-rose-500 to-amber-500',
      speaking: 'from-indigo-500 to-emerald-500',
      processing: 'from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800',
      idle: 'from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800'
    };
    
    return modeColors[mode] || modeColors.idle;
  };
  
  const containerClasses = `
    visualizer-container
    ${sizeClass.container}
    relative
    rounded-full
    overflow-hidden
    flex
    items-center
    justify-center
    border
    border-gray-200
    dark:border-gray-700
    bg-gray-50
    dark:bg-gray-900
    p-3
    transition-opacity
    duration-300
    ${isVisible ? 'opacity-100' : 'opacity-0'}
  `;
  
  return (
    <div className={containerClasses}>
      <div 
        ref={visualizerRef}
        className="visualizer-bars flex items-end justify-center h-full w-full gap-px"
      >
        {bars.map((height, index) => (
          <div
            key={index}
            className={`${sizeClass.bars} h-full relative overflow-hidden rounded-t-sm`}
          >
            <div
              className={`absolute bottom-0 w-full bg-gradient-to-t ${getColorClass()} transition-all duration-75`}
              style={{ 
                height: `${typeof height === 'object' ? height.height : height}%`,
                transitionDelay: typeof height === 'object' ? `${height.delay}ms` : '0ms'
              }}
            ></div>
          </div>
        ))}
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-white flex items-center justify-center">
        <div 
          className={`h-1.5 w-1.5 rounded-full ${
            mode === 'listening' ? 'bg-rose-500 animate-pulse' :
            mode === 'speaking' ? 'bg-indigo-500 animate-pulse' :
            mode === 'processing' ? 'bg-amber-500 animate-pulse' :
            'bg-gray-400'
          }`}
        ></div>
      </div>
    </div>
  );
};

export default VoiceVisualizer; 