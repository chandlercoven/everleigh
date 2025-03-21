import { useEffect, useState, useRef } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

const VoiceChat = () => {
  const [token, setToken] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Fetch a LiveKit token for the user
    const getToken = async () => {
      try {
        const username = 'user_' + Math.floor(Math.random() * 10000);
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
  }, []);

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

      // Process the transcribed text
      const processResponse = await fetch('/api/process-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: transcribedText,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process message');
      }

      const processData = await processResponse.json();
      setResponse(processData.data.response);

      // Convert the response to speech
      const audioResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: processData.data.response,
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

      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing your message');
      setIsProcessing(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!token) {
    return <div>Connecting to voice service...</div>;
  }

  return (
    <div className="voice-chat-container">
      <h2>Everleigh Voice Assistant</h2>
      
      <div className="voice-controls">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'recording' : ''}
          disabled={isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {isProcessing && <div className="processing-indicator">Processing...</div>}
      </div>
      
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
          background-color: #f0f5ff;
        }
        
        .response {
          background-color: #f0fff5;
        }
        
        .error-message {
          color: #e24a4a;
          font-weight: bold;
          padding: 20px;
          text-align: center;
        }
        
        .livekit-container {
          margin-top: 30px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default VoiceChat; 