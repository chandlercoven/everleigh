import React, { createContext, useContext, useCallback } from 'react';
import { useVoiceChatStore } from '../lib/store';
import useVoiceRecording from '../hooks/useVoiceRecording';
import useConversationManager from '../hooks/useConversationManager';
import useAudioResponse from '../hooks/useAudioResponse';
import useErrorHandler from '../hooks/useErrorHandler';
import { usePreferencesStore } from '../lib/store';

// Create context
const VoiceChatContext = createContext(null);

/**
 * Provider component that wraps parts of the app that need access to voice chat functionality
 */
export const VoiceChatProvider = ({ children }) => {
  // Get voice settings from preferences store
  const voiceSettings = usePreferencesStore(state => state.voiceSettings);
  
  // Initialize all the hooks
  const conversation = useConversationManager();
  const audioResponse = useAudioResponse(voiceSettings);
  const errorHandler = useErrorHandler();
  
  // Get state and actions from Zustand store
  const {
    isRecording,
    isProcessing,
    setIsRecording,
    setIsProcessing,
    setMessage,
    processMessage,
    conversationId
  } = useVoiceChatStore();
  
  // Initialize voice recording with status callback
  const { 
    startRecording, 
    stopRecording,
    getAudioLevel,
    recordingStatus,
    checkPermissions
  } = useVoiceRecording({
    onData: (audioBlob) => handleAudioProcessing(audioBlob),
    onStatusChange: (status, details) => {
      console.log(`Recording status: ${status}`, details);
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
    
    errorHandler.handleError(
      new Error(errorDetails.message || 'An error occurred while recording'),
      {
        type: errorDetails.type || 'unknown',
        source: 'recording',
        details: errorDetails.details || null
      }
    );
  };
  
  // Process audio recording with enhanced error handling
  const handleAudioProcessing = async (audioBlob) => {
    try {
      errorHandler.clearErrorState();
      
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

      console.log('Transcribed text:', transcribedText);
      
      // Set the message in the store which will trigger the AI processing
      setMessage(transcribedText);
      
      // Process with the API
      await processMessage(transcribedText, conversationId);
      
      // Play audio response if needed
      if (audioResponse && conversation.currentEmotion) {
        audioResponse.playAudioResponse(transcribedText);
      }
      
    } catch (error) {
      errorHandler.handleProcessingError(error, 'transcription');
      setIsProcessing(false);
    }
  };
  
  // Handle text input submission
  const handleSubmit = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    
    try {
      errorHandler.clearErrorState();
      
      // Add user message to conversation
      conversation.addMessage(text, 'user');
      
      // Process with the API
      setIsProcessing(true);
      await processMessage(text, conversationId);
      
    } catch (error) {
      errorHandler.handleProcessingError(error, 'text-input');
      setIsProcessing(false);
    }
  }, [conversation, errorHandler, processMessage, conversationId]);
  
  // Toggle recording state
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      try {
        const hasPermission = await checkPermissions();
        
        if (hasPermission) {
          setIsRecording(true);
          await startRecording();
        } else {
          errorHandler.handlePermissionError(
            new Error('Microphone permission denied'),
            'microphone'
          );
        }
      } catch (error) {
        errorHandler.handleError(error, {
          type: 'device_error',
          source: 'microphone',
          details: error.message
        });
      }
    }
  }, [isRecording, stopRecording, checkPermissions, startRecording, setIsRecording, errorHandler]);
  
  // Combine all the functionality into a single context value
  const contextValue = {
    // State
    isRecording,
    isProcessing,
    recordingStatus,
    errorInfo: errorHandler.errorInfo,
    
    // Actions
    toggleRecording,
    handleSubmit,
    clearError: errorHandler.clearErrorState,
    
    // Export from hooks
    conversation,
    audioResponse,
    getAudioLevel,
  };
  
  return (
    <VoiceChatContext.Provider value={contextValue}>
      {children}
    </VoiceChatContext.Provider>
  );
};

/**
 * Custom hook to use the voice chat context
 */
export const useVoiceChat = () => {
  const context = useContext(VoiceChatContext);
  
  if (!context) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider');
  }
  
  return context;
};

export default VoiceChatContext; 