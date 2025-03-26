// VoiceChatResponse component - displays the AI responses
import { useEffect, useRef } from 'react';
import { useVoiceChatStore, usePreferencesStore } from '../../lib/store';
import { getSmartDate } from '../../lib/date-utils';

const VoiceChatResponse = () => {
  const responseRef = useRef(null);
  const audioFeedbackRef = useRef(null);
  
  // Use the Zustand store for state management
  const {
    isProcessing,
    message,
    response,
    conversationId,
    setResponse,
    resetState,
  } = useVoiceChatStore();
  
  // Get theme preferences
  const { theme, uiPreferences } = usePreferencesStore();
  
  // Play success sound when response is received
  useEffect(() => {
    if (typeof window !== 'undefined' && response && !isProcessing) {
      if (!audioFeedbackRef.current) {
        audioFeedbackRef.current = new Audio('/audio/success.mp3');
        audioFeedbackRef.current.load();
        audioFeedbackRef.current.volume = 0.5;
      }
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        audioFeedbackRef.current.play().catch(e => console.error('Error playing audio', e));
      }
      
      // Scroll response into view if needed
      if (responseRef.current) {
        responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [response, isProcessing]);
  
  // Format message timestamp
  const getFormattedTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // If there's no message or response, don't render the component
  if (!message && !response) {
    return null;
  }
  
  // Helper function for response rendering
  const renderResponse = (text) => {
    // Process markdown-like formatting
    return text
      .split('\n')
      .map((line, i) => (
        <p key={i} className={`${i > 0 ? 'mt-2' : ''}`}>{line}</p>
      ));
  };
  
  // View conversation history function
  const viewConversationHistory = () => {
    if (conversationId) {
      window.location.href = `/conversations/${conversationId}`;
    }
  };
  
  // Container styling based on theme
  const containerClasses = `
    conversation-container 
    rounded-lg 
    p-4 
    mb-4
    border 
    border-${theme === 'dark' ? 'gray-700' : 'gray-200'}
    bg-${theme === 'dark' ? 'gray-800' : 'gray-50'}
  `.trim();
  
  const messageClasses = `
    user-message 
    bg-${theme === 'dark' ? 'gray-700' : 'gray-200'} 
    p-3 
    rounded-lg 
    mb-3
  `.trim();
  
  const responseClasses = `
    ai-response 
    bg-${theme === 'dark' ? 'blue-600/10' : 'blue-50'} 
    border 
    border-${theme === 'dark' ? 'blue-700/20' : 'blue-100'} 
    p-3 
    rounded-lg
  `.trim();
  
  return (
    <div ref={responseRef} className={containerClasses}>
      {/* User message */}
      {message && (
        <div className={messageClasses}>
          <div className="flex justify-between items-start">
            <div className="font-medium">You</div>
            <div className="text-xs text-gray-500">{getFormattedTime()}</div>
          </div>
          <div className="mt-1">{message}</div>
        </div>
      )}
      
      {/* AI response */}
      {response ? (
        <div className={responseClasses}>
          <div className="flex justify-between items-start">
            <div className="font-medium text-blue-600">Everleigh</div>
            <div className="text-xs text-gray-500">{getFormattedTime()}</div>
          </div>
          <div className="mt-1">{renderResponse(response)}</div>
        </div>
      ) : isProcessing ? (
        <div className={responseClasses}>
          <div className="flex justify-between items-start">
            <div className="font-medium text-blue-600">Everleigh</div>
            <div className="text-xs text-gray-500">{getFormattedTime()}</div>
          </div>
          <div className="mt-1 flex items-center">
            <div className="typing-indicator flex space-x-1">
              <span className="dot animate-bounce"></span>
              <span className="dot animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="dot animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Actions */}
      {(message || response) && (
        <div className="actions flex justify-end mt-3 space-x-2">
          {conversationId && (
            <button 
              onClick={viewConversationHistory}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              View History
            </button>
          )}
          
          <button 
            onClick={resetState}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Clear
          </button>
        </div>
      )}
      
      {/* Styling for typing indicator */}
      <style jsx>{`
        .dot {
          width: 8px;
          height: 8px;
          background-color: ${theme === 'dark' ? '#4b5563' : '#9ca3af'};
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default VoiceChatResponse; 