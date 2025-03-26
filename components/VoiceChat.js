import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceChatStore } from '../lib/store';
import { getSmartDate } from '../lib/date-utils';

const ModernVoiceChat = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Use the Zustand store for state management
  const {
    isRecording,
    isProcessing,
    message,
    response,
    error,
    conversationId,
    showWorkflowPanel,
    selectedWorkflow,
    workflowData,
    isWorkflowTriggering,
    workflowStatus,
    setIsRecording,
    setIsProcessing,
    setMessage,
    setResponse,
    setError,
    setConversationId,
    resetState,
    clearError,
    toggleWorkflowPanel,
    setSelectedWorkflow,
    setWorkflowData,
    triggerWorkflow,
    processMessage
  } = useVoiceChatStore();
  
  const [token, setToken] = useState('');
  
  // Available workflow types
  const workflowTypes = ['weather', 'calendar', 'reminder', 'email'];

  useEffect(() => {
    // Fetch a LiveKit token for the user
    const getToken = async () => {
      try {
        // Check if session exists and has user data
        if (!session || !session.user) {
          console.warn('No active session or user data found for token generation');
          setToken(''); // Clear any existing token
          return; // Don't proceed with token generation for unauthenticated users
        }
        
        // Use optional chaining to safely access user properties
        const username = session?.user?.name || session?.user?.email || 'anonymous_' + Math.floor(Math.random() * 10000);
        console.log(`Attempting to get LiveKit token for user: ${username}`);
        
        const response = await fetch('/api/get-livekit-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            room: 'everleigh-voice-room',
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to get token: ${response.status} ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        setToken(data.token);
        console.log('LiveKit token obtained successfully');
      } catch (error) {
        console.error('Error fetching token:', error);
        setError(`Failed to connect to voice service: ${error.message}`);
      }
    };

    getToken();
    
    // Get conversation ID from URL if provided
    if (router.query.conversationId) {
      setConversationId(router.query.conversationId);
    }
  }, [session, router.query.conversationId, setConversationId, setError]);

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob) => {
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
      const transcribedText = transcribeData.data.transcription;
      
      // Process the transcribed text using our Zustand action
      try {
        const processData = await processMessage(transcribedText);
        
        // Update URL with conversation ID without reloading page
        if (processData.conversationId) {
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, conversationId: processData.conversationId }
            },
            undefined,
            { shallow: true }
          );
        }

        // Convert the response to speech
        const audioResponse = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: processData.response,
          }),
        });

        if (!audioResponse.ok) {
          throw new Error('Failed to convert response to speech');
        }

        // Play the audio response
        const audioBlob = await audioResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (error) {
        if (error.message === 'Please sign in to use voice features') {
          setError(error.message);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing your message');
    } finally {
      setIsProcessing(false);
    }
  };

  // View conversation history
  const viewConversationHistory = () => {
    if (conversationId) {
      router.push(`/conversations/${conversationId}`);
    } else {
      router.push('/conversations');
    }
  };

  // Handle workflow data input
  const handleWorkflowDataChange = (e) => {
    setWorkflowData(e.target.value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Everleigh Voice Assistant</h1>
          <p className="text-gray-600">
            Talk to your AI assistant using your microphone.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 right-0 px-4 py-3" 
              onClick={clearError}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 8.586l3.293-3.293a1 1 0 111.414 1.414L11.414 10l3.293 3.293a1 1 0 11-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 011.414-1.414L10 8.586z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-2 sm:mb-0">Voice Chat</h2>
            <div className="flex space-x-2">
              <button
                onClick={viewConversationHistory}
                className="btn btn-secondary"
                disabled={!conversationId}
              >
                View History
              </button>
              <button
                onClick={toggleWorkflowPanel}
                className="btn btn-primary"
              >
                {showWorkflowPanel ? 'Hide Workflows' : 'Show Workflows'}
              </button>
            </div>
          </div>
          
          {/* Recording controls */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6 relative w-24 h-24">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-full h-full rounded-full focus:outline-none transition-colors ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </span>
                <svg
                  className="w-12 h-12 mx-auto text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isRecording ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-2">
              {isRecording
                ? 'Recording... Click to stop'
                : isProcessing
                ? 'Processing...'
                : 'Click to start recording'}
            </p>
          </div>
          
          {/* Conversation display */}
          {(message || response) && (
            <div className="border rounded-lg overflow-hidden mt-6">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-medium">Conversation</h3>
                {conversationId && (
                  <p className="text-xs text-gray-500">ID: {conversationId}</p>
                )}
              </div>
              <div className="p-4 space-y-4">
                {message && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">You</p>
                    <p>{message}</p>
                  </div>
                )}
                {response && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Assistant</p>
                    <p>{response}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Workflow panel */}
        {showWorkflowPanel && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Workflows</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="workflow" className="block text-sm font-medium mb-1">
                  Select Workflow
                </label>
                <select
                  id="workflow"
                  value={selectedWorkflow}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- Select a workflow --</option>
                  {workflowTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="workflowData" className="block text-sm font-medium mb-1">
                  Workflow Data (JSON or text)
                </label>
                <textarea
                  id="workflowData"
                  value={workflowData}
                  onChange={handleWorkflowDataChange}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder='{"key": "value"} or plain text'
                />
              </div>
              
              <button
                onClick={triggerWorkflow}
                disabled={!selectedWorkflow || !conversationId || isWorkflowTriggering}
                className={`btn btn-primary w-full ${
                  !selectedWorkflow || !conversationId || isWorkflowTriggering
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isWorkflowTriggering ? 'Triggering...' : 'Trigger Workflow'}
              </button>
              
              {workflowStatus && (
                <div
                  className={`mt-4 p-3 rounded-lg ${
                    workflowStatus.success
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  <p className="font-medium">
                    {workflowStatus.success ? 'Success' : 'Error'}
                  </p>
                  <p>{workflowStatus.message}</p>
                  {workflowStatus.taskId && (
                    <p className="text-sm mt-1">Task ID: {workflowStatus.taskId}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* LiveKit room */}
      {token && (
        <div className="hidden">
          <LiveKitRoom
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            connectOptions={{ autoSubscribe: true }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
};

export default ModernVoiceChat; 