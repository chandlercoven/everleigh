import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { 
  processVoiceMessage, 
  triggerWorkflow,
  getAvailableWorkflowTypes 
} from '../lib/api';

const VoiceChat = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [token, setToken] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [workflowData, setWorkflowData] = useState('');
  const [isWorkflowTriggering, setIsWorkflowTriggering] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const workflowTypes = getAvailableWorkflowTypes();

  useEffect(() => {
    // Fetch a LiveKit token for the user
    const getToken = async () => {
      try {
        // Use the actual user name when authenticated
        const username = session ? session.user.name || session.user.email : 'guest_' + Math.floor(Math.random() * 10000);
        
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
          throw new Error('Failed to get token');
        }
        
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error('Error fetching token:', error);
        setError('Failed to connect to voice service');
      }
    };

    getToken();
    
    // Get conversation ID from URL if provided
    if (router.query.conversationId) {
      setConversationId(router.query.conversationId);
    }
  }, [session, router.query.conversationId]);

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
      setMessage(transcribedText);

      // Process the transcribed text using our API utility
      try {
        const processData = await processVoiceMessage(transcribedText, conversationId);
        setResponse(processData.response);
        
        // Store conversation ID if provided
        if (processData.conversationId) {
          setConversationId(processData.conversationId);
          
          // Update URL with conversation ID without reloading page
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

      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing your message');
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

  // Toggle workflow panel
  const toggleWorkflowPanel = () => {
    setShowWorkflowPanel(!showWorkflowPanel);
    if (!showWorkflowPanel) {
      setSelectedWorkflow('');
      setWorkflowData('');
      setWorkflowStatus(null);
    }
  };

  // Handle workflow selection
  const handleWorkflowChange = (e) => {
    setSelectedWorkflow(e.target.value);
    setWorkflowStatus(null);
  };

  // Handle workflow data input
  const handleWorkflowDataChange = (e) => {
    setWorkflowData(e.target.value);
  };

  // Trigger selected workflow
  const handleTriggerWorkflow = async () => {
    if (!selectedWorkflow || !conversationId) {
      return;
    }

    setIsWorkflowTriggering(true);
    setWorkflowStatus(null);

    try {
      let parsedData = {};
      if (workflowData.trim()) {
        try {
          parsedData = JSON.parse(workflowData);
        } catch (e) {
          // If not valid JSON, use as string
          parsedData = { text: workflowData };
        }
      }

      const result = await triggerWorkflow(selectedWorkflow, conversationId, parsedData);
      
      setWorkflowStatus({
        success: true,
        message: result.message,
        taskId: result.taskId
      });
    } catch (error) {
      console.error('Error triggering workflow:', error);
      setWorkflowStatus({
        success: false,
        message: error.message
      });
    } finally {
      setIsWorkflowTriggering(false);
    }
  };

  // Display authentication message if not signed in
  if (!session) {
    return (
      <div className="auth-message">
        <h3>Authentication Required</h3>
        <p>Please sign in to use the voice chat feature.</p>
        <button 
          onClick={() => window.location.href = '/auth/signin'}
          className="sign-in-button"
        >
          Sign In
        </button>
        <style jsx>{`
          .auth-message {
            text-align: center;
            padding: 2rem;
          }
          .sign-in-button {
            padding: 0.75rem 1.5rem;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 1rem;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!token) {
    return <div>Connecting to voice service...</div>;
  }

  return (
    <div className="voice-chat-container">
      <h2>Everleigh Voice Assistant</h2>
      <p>Hello, {session.user.name || session.user.email}</p>
      
      <div className="voice-controls">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'recording' : ''}
          disabled={isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {isProcessing && <div className="processing-indicator">Processing...</div>}
        
        {conversationId && (
          <>
            <button 
              onClick={viewConversationHistory}
              className="history-button"
              disabled={isProcessing || isRecording}
            >
              View Conversation
            </button>
            
            <button 
              onClick={toggleWorkflowPanel}
              className={`workflow-button ${showWorkflowPanel ? 'active' : ''}`}
              disabled={isProcessing || isRecording}
            >
              {showWorkflowPanel ? 'Hide Workflows' : 'Run Workflow'}
            </button>
          </>
        )}
      </div>
      
      {showWorkflowPanel && conversationId && (
        <div className="workflow-panel">
          <h3>Run n8n Workflow</h3>
          
          <div className="workflow-form">
            <div className="form-group">
              <label htmlFor="workflow-type">Select Workflow:</label>
              <select 
                id="workflow-type" 
                value={selectedWorkflow} 
                onChange={handleWorkflowChange}
                disabled={isWorkflowTriggering}
              >
                <option value="">-- Select a workflow --</option>
                {workflowTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="workflow-data">Workflow Data (optional JSON):</label>
              <textarea 
                id="workflow-data" 
                value={workflowData} 
                onChange={handleWorkflowDataChange}
                placeholder='{"key": "value"}'
                disabled={isWorkflowTriggering}
                rows={4}
              />
            </div>
            
            <button 
              onClick={handleTriggerWorkflow}
              disabled={!selectedWorkflow || isWorkflowTriggering}
              className="trigger-button"
            >
              {isWorkflowTriggering ? 'Triggering...' : 'Trigger Workflow'}
            </button>
          </div>
          
          {workflowStatus && (
            <div className={`workflow-status ${workflowStatus.success ? 'success' : 'error'}`}>
              <p>{workflowStatus.message}</p>
              {workflowStatus.taskId && (
                <p className="task-id">Task ID: {workflowStatus.taskId}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {message && (
        <div className="message">
          <strong>You said:</strong>
          <p>{message}</p>
        </div>
      )}
      
      {response && (
        <div className="response">
          <strong>Everleigh:</strong>
          <p>{response}</p>
        </div>
      )}
      
      <div className="livekit-container">
        <LiveKitRoom
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          token={token}
          connectOptions={{ autoSubscribe: true }}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
      
      <style jsx>{`
        .voice-chat-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .voice-controls {
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        button {
          padding: 12px 24px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        
        button:hover {
          background-color: #3a7bc8;
        }
        
        button.recording {
          background-color: #e24a4a;
          animation: pulse 1.5s infinite;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .history-button {
          background-color: #00c853;
        }
        
        .history-button:hover {
          background-color: #00a846;
        }
        
        .workflow-button {
          background-color: #9c27b0;
        }
        
        .workflow-button:hover {
          background-color: #7b1fa2;
        }
        
        .workflow-button.active {
          background-color: #6a1b9a;
        }
        
        .workflow-panel {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .workflow-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-weight: 500;
          color: #333;
        }
        
        select, textarea {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .trigger-button {
          align-self: flex-start;
          background-color: #ff5722;
        }
        
        .trigger-button:hover {
          background-color: #e64a19;
        }
        
        .workflow-status {
          margin-top: 15px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .workflow-status.success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .workflow-status.error {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .task-id {
          font-size: 12px;
          margin-top: 5px;
          color: #666;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .processing-indicator {
          margin-left: 15px;
          color: #666;
        }
        
        .message, .response {
          margin: 15px 0;
          padding: 15px;
          border-radius: 8px;
        }
        
        .message {
          background-color: #f0f4f8;
        }
        
        .response {
          background-color: #e8f5e9;
        }
        
        .error-message {
          color: #d32f2f;
          background-color: #ffebee;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        
        .livekit-container {
          margin-top: 30px;
          height: 400px;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default VoiceChat; 