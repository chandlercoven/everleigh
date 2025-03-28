import React, { useEffect, useRef, useState } from 'react';
import { usePreferencesStore } from '../../lib/store';
import { Message } from '../../types';

// Define props interface
interface ConversationBubbleProps {
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date | string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry';
  isTyping?: boolean;
  isSpeaking?: boolean;
  onPlayAudio?: (() => void) | null;
}

// Define emotion styles interface
interface EmotionStyleSet {
  bg: string;
  border: string;
  shadow: string;
  gradient: string;
}

/**
 * ConversationBubble - A modern, animated chat bubble component
 * that incorporates emotion detection and visual feedback
 */
const ConversationBubble: React.FC<ConversationBubbleProps> = ({ 
  message, 
  sender, 
  timestamp, 
  emotion = 'neutral',
  isTyping = false,
  isSpeaking = false,
  onPlayAudio = null
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { uiPreferences } = usePreferencesStore();

  // Animation timing for staggered reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle intersection observer for animations
  useEffect(() => {
    if (!bubbleRef.current || !uiPreferences.enableAnimations) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          bubbleRef.current?.classList.add('animate-in');
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(bubbleRef.current);
    
    return () => {
      if (bubbleRef.current) {
        observer.unobserve(bubbleRef.current);
      }
    };
  }, [uiPreferences.enableAnimations]);

  // Map emotion to colors and styles
  const getEmotionStyles = (): EmotionStyleSet => {
    const emotionMap: Record<string, EmotionStyleSet> = {
      happy: {
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-700',
        shadow: 'shadow-amber-100 dark:shadow-amber-900/20',
        gradient: 'from-amber-100 to-amber-50 dark:from-amber-800/20 dark:to-amber-900/20'
      },
      sad: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        shadow: 'shadow-blue-100 dark:shadow-blue-900/20',
        gradient: 'from-blue-100 to-blue-50 dark:from-blue-800/20 dark:to-blue-900/20'
      },
      angry: {
        bg: 'bg-rose-50 dark:bg-rose-900/30',
        border: 'border-rose-200 dark:border-rose-800',
        shadow: 'shadow-rose-100 dark:shadow-rose-900/20',
        gradient: 'from-rose-100 to-rose-50 dark:from-rose-800/20 dark:to-rose-900/20'
      },
      neutral: {
        bg: sender === 'user' 
          ? 'bg-indigo-50 dark:bg-indigo-900/30' 
          : 'bg-gray-50 dark:bg-gray-800/50',
        border: sender === 'user' 
          ? 'border-indigo-200 dark:border-indigo-800' 
          : 'border-gray-200 dark:border-gray-700',
        shadow: sender === 'user' 
          ? 'shadow-indigo-100 dark:shadow-indigo-900/20' 
          : 'shadow-gray-100 dark:shadow-gray-900/20',
        gradient: sender === 'user' 
          ? 'from-indigo-100 to-indigo-50 dark:from-indigo-800/20 dark:to-indigo-900/20' 
          : 'from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-900/20'
      }
    };
    
    return emotionMap[emotion] || emotionMap.neutral;
  };
  
  const emotionStyles = getEmotionStyles();
  
  // Message container classes
  const containerClasses = `
    message-container
    ${sender === 'user' ? 'justify-end' : 'justify-start'}
    mb-4
    transition-opacity duration-300 ease-in-out
    ${isVisible ? 'opacity-100' : 'opacity-0'}
  `;
  
  // Bubble classes
  const bubbleClasses = `
    message-bubble
    ${sender === 'user' ? 'rounded-t-xl rounded-bl-xl' : 'rounded-t-xl rounded-br-xl'}
    p-4
    max-w-xs md:max-w-md lg:max-w-lg
    border
    ${emotionStyles.border}
    ${emotionStyles.bg}
    bg-gradient-to-br ${emotionStyles.gradient}
    ${emotionStyles.shadow}
    shadow-lg
    transition-all
    duration-300
    ${isSpeaking ? 'border-b-2 border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30' : ''}
  `;

  // Typing animation
  const renderTypingIndicator = () => (
    <div className="typing-indicator flex space-x-2 mt-2">
      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  // Message header with sender and timestamp
  const renderHeader = () => (
    <div className="message-header flex justify-between items-center mb-1">
      <span className="font-medium text-xs text-gray-700 dark:text-gray-300">
        {sender === 'user' ? 'You' : 'Everleigh'}
      </span>
      {timestamp && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {typeof timestamp === 'string' ? timestamp : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );

  return (
    <div className={containerClasses}>
      <div 
        ref={bubbleRef}
        className={bubbleClasses}
      >
        {renderHeader()}
        
        <div className="message-content">
          {isTyping ? (
            renderTypingIndicator()
          ) : (
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {message}
            </p>
          )}
        </div>
        
        {onPlayAudio && sender !== 'user' && (
          <button 
            onClick={onPlayAudio}
            className="play-audio-btn ml-auto block mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            aria-label="Play audio"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
              </svg>
              Listen
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversationBubble; 