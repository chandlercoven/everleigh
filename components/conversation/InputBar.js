import React, { useState, useRef } from 'react';
import { useVoiceChat } from '../../contexts/VoiceChatContext';

/**
 * InputBar - Component for text input in the conversation UI
 * Uses VoiceChatContext for state management instead of props
 */
const InputBar = () => {
  const [inputValue, setInputValue] = useState('');
  const messageInputRef = useRef(null);
  const { isProcessing, handleSubmit } = useVoiceChat();
  
  const onSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    handleSubmit(inputValue);
    setInputValue('');
  };
  
  return (
    <div className="conversation-input p-4 border-t border-gray-200 dark:border-gray-700">
      <form onSubmit={onSubmit} className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isProcessing}
          className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ref={messageInputRef}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isProcessing}
          className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default InputBar; 