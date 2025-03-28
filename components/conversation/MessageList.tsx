import React from 'react';
import ConversationBubble from '../ui/ConversationBubble';
import { useVoiceChat } from '../../contexts/VoiceChatContext';

/**
 * MessageList - Component that renders the conversation history
 * Uses VoiceChatContext for state management instead of props
 */
const MessageList: React.FC = () => {
  const { conversation } = useVoiceChat();
  const { messages, isTyping, currentEmotion, messagesEndRef } = conversation;
  
  return (
    <div className="conversation-history flex-grow overflow-y-auto p-4 space-y-4">
      {messages.map(msg => (
        <ConversationBubble
          key={msg.id}
          message={msg.text}
          sender={msg.sender}
          emotion={msg.emotion}
          timestamp={msg.timestamp}
        />
      ))}
      
      {isTyping && (
        <div className="typing-indicator flex space-x-2 opacity-70">
          <div className="dot animate-bounce"></div>
          <div className="dot animate-bounce delay-100"></div>
          <div className="dot animate-bounce delay-200"></div>
        </div>
      )}
      
      {/* Invisible element for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 