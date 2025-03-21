import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // In a real application, you would fetch a token from your server
    // This is a placeholder for demo purposes
    const getToken = async () => {
      try {
        // Replace with actual API call to get LiveKit token
        // const response = await fetch('/api/get-livekit-token');
        // const data = await response.json();
        // setToken(data.token);
        console.log('Token would be fetched here in a real application');
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    getToken();
  }, []);

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="voice-chat-container">
      <h2>Voice Chat</h2>
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        // Connect only to audio
        connectOptions={{ autoSubscribe: true }}
        // Show only audio tracks
        renderParams={{
          videoCaptureDefaults: {
            deviceId: undefined,
          },
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default VoiceChat; 