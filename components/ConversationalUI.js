import React, { useState, useEffect, useRef } from 'react';
import { useVoiceChatStore, usePreferencesStore } from '../lib/store';
import ConversationBubble from './ui/ConversationBubble';
import VoiceVisualizer from './ui/VoiceVisualizer';

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
    conversationId
  } = useVoiceChatStore();
  
  const { theme, uiPreferences, voiceSettings } = usePreferencesStore();
  
  // Initialize voice recording hook
  const { 
    startRecording, 
    stopRecording,
    getAudioLevel
  } = useVoiceRecording({
    onData: (audioBlob) => handleAudioProcessing(audioBlob),
    onError: (error) => console.error('Recording error:', error)
  });
  
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
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
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
  
  // Process audio recording
  const handleAudioProcessing = async (audioBlob) => {
    try {
      // Create a form to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Transcribe the audio
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcribeData = await transcribeResponse.json();
      const transcribedText = transcribeData.data?.transcription || transcribeData.text;
      
      // Set message in store and update UI
      setMessage(transcribedText);
      await processMessage(transcribedText);
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
    }
  };
  
  // Handle text input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add to conversation
    setMessage(userMessage);
    addMessage(userMessage, 'user');
    
    // Process through voice chat system
    await processMessage(userMessage);
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Play audio response
  const playAudioResponse = async (text, voiceId = selectedVoice) => {
    if (!voiceId || !text) return;
    
    try {
      setIsSpeaking(true);
      
      const audioResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
          ...voiceSettings
        }),
      });

      if (!audioResponse.ok) {
        throw new Error('Failed to convert response to speech');
      }

      // Play the audio response
      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error playing audio response:', error);
      setIsSpeaking(false);
    }
  };
  
  // Replay the audio for a specific message
  const replayAudio = (text) => {
    playAudioResponse(text);
  };
  
  return (
    <div className="conversational-ui w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Conversation with Everleigh</h2>
          {conversationId && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">ID: {conversationId.slice(0, 8)}</span>
          )}
        </div>
        
        {/* Voice selection */}
        {availableVoices.length > 0 && (
          <div className="flex items-center">
            <label htmlFor="voice-select" className="text-sm text-gray-600 dark:text-gray-400 mr-2">Voice:</label>
            <select
              id="voice-select"
              value={selectedVoice || ''}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isProcessing || isRecording || isSpeaking}
              className="text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1"
            >
              {availableVoices.map(voice => (
                <option key={voice.voice_id || voice.id} value={voice.voice_id || voice.id}>
                  {voice.name || `Voice ${voice.voice_id || voice.id || 'Unknown'}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Conversation area */}
      <div 
        ref={conversationRef}
        className="conversation-container h-96 md:h-[500px] overflow-y-auto p-4 space-y-4 flex flex-col"
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <div className="mb-4">
              <VoiceVisualizer mode="idle" size="lg" />
            </div>
            <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
            <p className="max-w-md">
              Type a message or click the microphone button to speak with Everleigh.
            </p>
          </div>
        )}
        
        {/* Message bubbles */}
        {messages.map((msg) => (
          <ConversationBubble
            key={msg.id}
            message={msg.text}
            sender={msg.sender}
            timestamp={msg.timestamp}
            emotion={msg.emotion}
            isSpeaking={isSpeaking && messages[messages.length - 1]?.id === msg.id && msg.sender === 'ai'}
            onPlayAudio={() => replayAudio(msg.text)}
          />
        ))}
        
        {/* AI typing indicator */}
        {isTyping && (
          <ConversationBubble
            message=""
            sender="ai"
            isTyping={true}
          />
        )}
        
        {/* Error message */}
        {error && (
          <div className="error-message bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
            <p>{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="input-container border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Voice button with visualizer */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`
                voice-button
                h-12 w-12
                flex items-center justify-center
                rounded-full
                transition-all
                ${isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-indigo-500 hover:bg-indigo-600'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                text-white
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              `}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isProcessing ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isRecording ? (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            {/* Audio level visualizer (only visible when recording) */}
            {isRecording && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-16">
                <VoiceVisualizer 
                  isActive={true}
                  mode="listening"
                  audioLevel={audioLevel}
                  size="sm"
                />
              </div>
            )}
          </div>
          
          {/* Text input */}
          <div className="flex-grow relative">
            <input
              ref={messageInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isProcessing || isRecording}
              placeholder="Type your message..."
              className={`
                w-full
                border
                border-gray-300
                dark:border-gray-700
                rounded-full
                py-3
                px-4
                bg-white
                dark:bg-gray-800
                text-gray-800
                dark:text-gray-200
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                disabled:opacity-60
                disabled:cursor-not-allowed
                transition-colors
              `}
            />
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={isProcessing || isRecording || !inputValue.trim()}
              className={`
                absolute
                right-2
                top-1/2
                -translate-y-1/2
                w-8
                h-8
                flex
                items-center
                justify-center
                rounded-full
                ${inputValue.trim() ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}
                disabled:opacity-50
                disabled:cursor-not-allowed
                text-white
              `}
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </form>
        
        {/* Accessibility note */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-14">
          {isRecording 
            ? 'Recording... Click the microphone button again to stop.' 
            : isSpeaking 
              ? 'Speaking...' 
              : 'Press the microphone button to use voice input.'}
        </p>
      </div>
    </div>
  );
};

export default ConversationalUI; 