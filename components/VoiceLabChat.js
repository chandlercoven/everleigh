import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import '@livekit/components-styles';

const VoiceLabChat = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('pNInz6obpgDQGcFmaJgB'); // Default ElevenLabs voice
  const [availableVoices, setAvailableVoices] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    // Fetch available voices on component mount
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          if (data.voices && Array.isArray(data.voices)) {
            setAvailableVoices(data.voices);
          } else {
            console.error('Invalid voices data format:', data);
            setAvailableVoices([]);
          }
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setAvailableVoices([]);
      }
    };

    fetchVoices();
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
          isGuest: true, // Mark as guest to bypass authentication
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process message');
      }

      const processData = await processResponse.json();
      setResponse(processData.response);

      // Convert the response to speech
      setIsSpeaking(true);
      const audioResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: processData.response,
          voiceId: selectedVoice,
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
        audioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.play();
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing your message');
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  // Handle voice selection
  const handleVoiceChange = (e) => {
    setSelectedVoice(e.target.value);
  };

  return (
    <div className="voice-lab-container">
      <h2>Voice AI Lab</h2>
      <p>Test voice interactions without signing in</p>
      
      {availableVoices && availableVoices.length > 0 ? (
        <div className="voice-selection">
          <label htmlFor="voice-select">Select Voice:</label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={handleVoiceChange}
            disabled={isProcessing || isRecording || isSpeaking}
          >
            {availableVoices.map(voice => (
              <option key={voice.voice_id || voice.id || Math.random()} value={voice.voice_id || voice.id}>
                {voice.name || `Voice ${voice.voice_id || voice.id || 'Unknown'}`}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="voice-selection">
          <span>Using default voice (no voices available)</span>
        </div>
      )}
      
      <div className="voice-interface">
        <div className={`ai-avatar ${isSpeaking ? 'speaking' : ''}`}>
          <div className="avatar-circle">
            <div className="sound-wave">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="wave-bar"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="voice-controls">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? 'recording' : ''}
            disabled={isProcessing || isSpeaking}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          {isProcessing && <div className="processing-indicator">Processing...</div>}
        </div>
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <div className="conversation">
        {message && (
          <div className="message user-message">
            <strong>You:</strong>
            <p>{message}</p>
          </div>
        )}
        
        {response && (
          <div className="message ai-message">
            <strong>AI:</strong>
            <p>{response}</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .voice-lab-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        h2 {
          color: #333;
          margin-bottom: 5px;
        }
        
        p {
          color: #666;
          margin-top: 0;
        }
        
        .voice-selection {
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        select {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background-color: white;
          font-size: 14px;
        }
        
        .voice-interface {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 30px 0;
        }
        
        .ai-avatar {
          margin-bottom: 20px;
        }
        
        .avatar-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(145deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }
        
        .sound-wave {
          display: flex;
          align-items: center;
          height: 60px;
          width: 60px;
          justify-content: space-between;
        }
        
        .wave-bar {
          width: 6px;
          height: 20px;
          background-color: white;
          border-radius: 3px;
          opacity: 0.8;
        }
        
        .ai-avatar.speaking .wave-bar {
          animation-name: sound-wave;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        
        .ai-avatar.speaking .wave-bar:nth-child(1) {
          animation-duration: 0.7s;
        }
        
        .ai-avatar.speaking .wave-bar:nth-child(2) {
          animation-duration: 0.6s;
          animation-delay: 0.1s;
        }
        
        .ai-avatar.speaking .wave-bar:nth-child(3) {
          animation-duration: 0.5s;
          animation-delay: 0.2s;
        }
        
        .ai-avatar.speaking .wave-bar:nth-child(4) {
          animation-duration: 0.6s;
          animation-delay: 0.15s;
        }
        
        .ai-avatar.speaking .wave-bar:nth-child(5) {
          animation-duration: 0.7s;
          animation-delay: 0.05s;
        }
        
        @keyframes sound-wave {
          0% { height: 10px; }
          50% { height: 40px; }
          100% { height: 10px; }
        }
        
        .voice-controls {
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        button {
          padding: 12px 24px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
        }
        
        button:hover {
          background-color: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(79, 70, 229, 0.3);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        button.recording {
          background-color: #dc2626;
          animation: pulse 1.5s infinite;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        
        .processing-indicator {
          margin-left: 15px;
          color: #666;
          font-style: italic;
        }
        
        .conversation {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .message {
          padding: 16px;
          border-radius: 12px;
          max-width: 80%;
        }
        
        .message strong {
          display: block;
          margin-bottom: 5px;
        }
        
        .message p {
          margin: 0;
          line-height: 1.5;
        }
        
        .user-message {
          background-color: #f3f4f6;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        
        .ai-message {
          background-color: #eff6ff;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }
        
        .error-message {
          color: #b91c1c;
          background-color: #fee2e2;
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default VoiceLabChat; 