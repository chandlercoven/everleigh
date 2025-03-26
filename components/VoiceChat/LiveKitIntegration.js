// LiveKitIntegration component - handles LiveKit room connection
import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceChatStore } from '../../lib/store';

const LiveKitIntegration = ({ session }) => {
  const [token, setToken] = useState('');
  
  const {
    setError,
  } = useVoiceChatStore();

  // Get LiveKit token
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
  }, [session, setError]);

  // If no token, don't render the LiveKit room
  if (!token) {
    return null;
  }

  return (
    <div className="livekit-container">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        // Use custom options for a more streamlined experience
        options={{
          publishDefaults: {
            simulcast: true,
            videoSimulcastLayers: [{ width: 320, height: 240, encoding: { maxBitrate: 150_000, maxFramerate: 15 } }],
          },
          adaptiveStream: true,
          dynacast: true,
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default LiveKitIntegration; 