import React, { useState, useEffect, useRef } from 'react';
import { useVoiceChatStore, usePreferencesStore } from '../lib/store';
import ConversationBubble from './ui/ConversationBubble';
import VoiceVisualizer from './ui/VoiceVisualizer';
import ErrorFeedback from './ui/ErrorFeedback';

// Import existing recorder functionality
import useVoiceRecording from '../hooks/useVoiceRecording';

/**
 * ConversationalUI - A modern, unified interface for voice and text chat
 * Combines the existing VoiceChatRecorder and VoiceLabChat functionality
 * while providing a more engaging, emotionally responsive interface
 */
const ConversationalUI = () => {
  // References
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const conversationRef = useRef(null);
  const audioRef = useRef(null);
  
  // Local state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [errorInfo, setErrorInfo] = useState(null);
  
  // Global state from stores
  const {
    isRecording,
    isProcessing,
    message: transcribedMessage,
    response: aiResponse,
    error,
    setIsRecording,
    setIsProcessing,
    setMessage,
    processMessage,
    clearError,
    conversationId
  } = useVoiceChatStore();
  
  const { theme, uiPreferences, voiceSettings } = usePreferencesStore();
  
  // Initialize voice recording hook with status callback
  const { 
    startRecording, 
    stopRecording,
    getAudioLevel,
    recordingStatus: hookRecordingStatus,
    checkPermissions
  } = useVoiceRecording({
    onData: (audioBlob) => handleAudioProcessing(audioBlob),
    onStatusChange: (status, details) => {
      console.log(`Recording status: ${status}`, details);
      setRecordingStatus(status);
      if (status === 'error') {
        handleRecordingError(details);
      }
    },
    onError: (error) => handleRecordingError({ message: error.message, type: 'unknown' }),
    debug: process.env.NODE_ENV === 'development'
  });
  
  // Handle recording errors with detailed information
  const handleRecordingError = (errorDetails) => {
    console.error('Recording error:', errorDetails);
    setIsRecording(false);
    setIsProcessing(false);
    
    // Map error types to more user-friendly information
    let errorType = errorDetails.type || 'unknown';
    let errorMessage = errorDetails.message || 'An error occurred while recording';
    
    // Set error info for UI display
    setErrorInfo({
      message: errorMessage,
      type: errorType,
      details: errorDetails.details || null
    });
  };
  
  // Clear errors
  const clearErrorState = () => {
    setErrorInfo(null);
    clearError();
  };
  
  // Initialize voice options on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          if (data.voices && Array.isArray(data.voices)) {
            setAvailableVoices(data.voices);
            
            // Set default voice from preferences or first available
            if (voiceSettings.voice && voiceSettings.voice !== 'default') {
              setSelectedVoice(voiceSettings.voice);
            } else if (data.voices.length > 0) {
              setSelectedVoice(data.voices[0].voice_id || data.voices[0].id);
            }
          }
        } else {
          console.error('Error fetching voices:', await response.text());
          setErrorInfo({
            message: 'Could not load voice options',
            type: 'network_error',
            details: `Status: ${response.status}`
          });
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setErrorInfo({
          message: 'Could not load voice options',
          type: 'network_error',
          details: error.message
        });
      }
    };

    fetchVoices();
  }, [voiceSettings.voice]);
  
  // Update audio level when recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const level = getAudioLevel();
        setAudioLevel(level);
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isRecording, getAudioLevel]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle transcribed message and AI response from store
  useEffect(() => {
    if (transcribedMessage && !messages.some(m => m.text === transcribedMessage && m.sender === 'user')) {
      addMessage(transcribedMessage, 'user');
    }
  }, [transcribedMessage]);
  
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
        playAudioResponse(aiResponse);
      }, Math.min(1000, aiResponse.length * 20));
    }
  }, [aiResponse]);
  
  // Handle errors from the store
  useEffect(() => {
    if (error) {
      console.error('Store error:', error);
      setErrorInfo({
        message: error,
        type: 'processing_error'
      });
    }
  }, [error]);
  
  // Detect emotion based on message content
  const detectEmotion = (text) => {
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
  const addMessage = (text, sender, emotion = 'neutral') => {
    setMessages(prevMessages => [...prevMessages, {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date(),
      emotion
    }]);
  };
  
  // Process audio recording with enhanced error handling
  const handleAudioProcessing = async (audioBlob) => {
    try {
      clearErrorState();
      
      // Create a form to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Log audio blob size for debugging
      console.log(`Processing audio: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      if (audioBlob.size < 100) {
        throw new Error('Audio recording too short or empty');
      }

      // Transcribe the audio
      setIsProcessing(true);
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text();
        console.error('Transcription failed:', transcribeResponse.status, errorText);
        
        throw new Error(`Failed to transcribe audio (${transcribeResponse.status})`);
      }

      const transcribeData = await transcribeResponse.json();
      const transcribedText = transcribeData.data?.transcription || transcribeData.text;
      
      if (!transcribedText || transcribedText.trim() === '') {
        throw new Error('No speech detected. Please try speaking more clearly.');
      }
      
      // Set message in store and update UI
      setMessage(transcribedText);
      
      // Process the transcribed text
      await processMessage(transcribedText).catch(error => {
        throw new Error(`Failed to process message: ${error.message}`);
      });
      
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Determine error type from message
      let errorType = 'processing_error';
      
      if (error.message.includes('transcribe')) {
        errorType = 'transcription_error';
      } else if (error.message.includes('network') || error.message.includes('failed to fetch')) {
        errorType = 'network_error';
      }
      
      setErrorInfo({
        message: error.message || 'Failed to process your speech',
        type: errorType,
        details: error.stack
      });
      
      setIsProcessing(false);
    }
  };
  
  // Handle text input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    try {
      clearErrorState();
      const userMessage = inputValue.trim();
      setInputValue('');
      
      // Add to conversation
      setMessage(userMessage);
      addMessage(userMessage, 'user');
      
      // Process through voice chat system
      await processMessage(userMessage);
    } catch (error) {
      console.error('Error processing text input:', error);
      setErrorInfo({
        message: error.message || 'Failed to process your message',
        type: 'processing_error',
        details: error.stack
      });
    }
  };
  
  // Toggle recording with proper permission checks
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        clearErrorState();
        
        // Check permissions first
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          return; // Error will be handled by the onStatusChange callback
        }
        
        await startRecording();
      } catch (error) {
        console.error('Error starting recording:', error);
        setErrorInfo({
          message: error.message || 'Failed to start recording',
          type: 'unknown',
          details: error.stack
        });
      }
    }
  };
  
  // Play audio response
  const playAudioResponse = async (text) => {
    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(e => {
        console.error('Error playing audio response:', e);
        setIsSpeaking(false);
      });
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsSpeaking(false);
      
      setErrorInfo({
        message: 'Failed to generate speech for the response',
        type: 'processing_error',
        details: error.message
      });
    }
  };
  
  // Render the conversation UI
  return (
    <div className="conversational-ui flex flex-col h-full">
      {/* Error display */}
      {errorInfo && (
        <div className="mb-4">
          <ErrorFeedback
            message={errorInfo.message}
            type={errorInfo.type}
            details={errorInfo.details}
            onRetry={() => clearErrorState()}
            onDismiss={() => clearErrorState()}
          />
        </div>
      )}
      
      {/* Conversation history */}
      <div 
        ref={conversationRef}
        className="conversation-history flex-grow overflow-y-auto p-4 space-y-4"
      >
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
      
      {/* Input area */}
      <div className="conversation-input p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Recording visualizer */}
        <div className="mb-4 flex justify-center">
          <VoiceVisualizer 
            isActive={isRecording} 
            audioLevel={audioLevel} 
            status={recordingStatus}
          />
        </div>
        
        {/* Status indicator */}
        <div className="text-center mb-2 text-sm">
          {isProcessing && (
            <span className="text-blue-500 dark:text-blue-400 animate-pulse">
              Processing your message...
            </span>
          )}
          {isRecording && (
            <span className="text-red-500 dark:text-red-400">
              Listening... Tap to stop
            </span>
          )}
          {isSpeaking && (
            <span className="text-green-500 dark:text-green-400">
              Speaking...
            </span>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Record button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isProcessing || isSpeaking}
            className={`
              record-button
              flex-shrink-0
              rounded-full
              w-12
              h-12
              flex
              items-center
              justify-center
              transition-all
              ${isRecording ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'}
              disabled:opacity-50
              disabled:cursor-not-allowed
            `}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          {/* Text input */}
          <form onSubmit={handleSubmit} className="flex-grow flex">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isRecording || isProcessing}
              className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ref={messageInputRef}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isRecording || isProcessing}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConversationalUI; 