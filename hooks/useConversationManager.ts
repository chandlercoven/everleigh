import { useState, useRef, useEffect, RefObject } from 'react';
import { useVoiceChatStore } from '../lib/store';
import { Message, ConversationManagerHook } from '../types';

/**
 * Custom hook to manage conversation state including messages, typing, and emotions
 * Extracts and encapsulates conversation logic from ConversationalUI
 */
const useConversationManager = (): ConversationManagerHook => {
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  
  // Get relevant state from the store
  const {
    message: transcribedMessage,
    response: aiResponse,
  } = useVoiceChatStore();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle transcribed message from store
  useEffect(() => {
    if (transcribedMessage && !messages.some(m => m.text === transcribedMessage && m.sender === 'user')) {
      addMessage(transcribedMessage, 'user');
    }
  }, [transcribedMessage, messages]);
  
  // Handle AI response from store
  useEffect(() => {
    if (aiResponse && !messages.some(m => m.text === aiResponse && m.sender === 'ai')) {
      setIsTyping(true);
      
      // Simulate typing effect
      setTimeout(() => {
        setIsTyping(false);
        
        // Determine emotion based on content
        const emotion = detectEmotion(aiResponse);
        setCurrentEmotion(emotion);
        
        addMessage(aiResponse, 'ai', emotion);
      }, Math.min(1000, aiResponse.length * 20));
    }
  }, [aiResponse, messages]);
  
  // Detect emotion based on message content
  const detectEmotion = (text: string): string => {
    // Simple rule-based emotion detection
    const lowerText = text.toLowerCase();
    
    if (/great|happy|amazing|excellent|awesome|😊|😄|🙂|😀/.test(lowerText)) {
      return 'happy';
    } else if (/sorry|unfortunate|sad|regret|😔|😢|🙁|😞/.test(lowerText)) {
      return 'sad';
    } else if (/urgent|important|warning|alert|⚠️|❗|❕|⚡/.test(lowerText)) {
      return 'angry';
    }
    
    return 'neutral';
  };
  
  // Add a message to the conversation
  const addMessage = (text: string, sender: 'user' | 'ai', emotion: string = 'neutral'): void => {
    setMessages(prevMessages => [...prevMessages, {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date(),
      emotion: emotion as 'neutral' | 'happy' | 'sad' | 'angry'
    }]);
  };
  
  // Clear all messages
  const clearMessages = (): void => {
    setMessages([]);
  };
  
  return {
    messages,
    isTyping,
    currentEmotion,
    messagesEndRef: messagesEndRef as React.RefObject<HTMLDivElement>,
    addMessage,
    setIsTyping,
    detectEmotion,
    clearMessages
  };
};

export default useConversationManager; 