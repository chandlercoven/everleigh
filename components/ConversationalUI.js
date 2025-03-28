import React from 'react';
import ErrorFeedback from './ui/ErrorFeedback';
import MessageList from './conversation/MessageList';
import InputBar from './conversation/InputBar';
import VoiceControls from './conversation/VoiceControls';
import AudioPlayer from './conversation/AudioPlayer';
import { VoiceChatProvider, useVoiceChat } from '../contexts/VoiceChatContext';

/**
 * Inner component that uses the VoiceChat context
 */
const ConversationalUIInner = () => {
  const { errorInfo, clearError } = useVoiceChat();
  
  return (
    <div className="flex flex-col h-full">
      {/* Error display */}
      {errorInfo && (
        <ErrorFeedback
          error={errorInfo}
          onClose={clearError}
        />
      )}
      
      {/* Message area */}
      <MessageList />
      
      {/* Input area */}
      <InputBar />
      
      {/* Voice controls */}
      <VoiceControls />
      
      {/* Hidden audio player */}
      <AudioPlayer />
    </div>
  );
};

/**
 * ConversationalUI - A modern, unified interface for voice and text chat
 * Uses context-based architecture for better separation of concerns
 */
const ConversationalUI = () => {
  return (
    <VoiceChatProvider>
      <ConversationalUIInner />
    </VoiceChatProvider>
  );
};

export default ConversationalUI; 