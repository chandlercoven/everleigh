// LiveKitIntegration component - handles LiveKit room connection
import React, { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceChatStore } from '../../lib/store';
import { Session } from 'next-auth';

/**
 * Interface for LiveKitIntegration component props
 */
interface LiveKitIntegrationProps {
  session: Session | null;
}

/**
 * User interface for session user data
 */
interface User {
  name?: string;
  email?: string;
  id?: string;
  sub?: string;
  [key: string]: any;
}

/**
 * Safely access nested properties with fallback
 */
const safeGet = (obj: any, path: string, fallback: any = null): any => {
  try {
    return path.split('.').reduce((acc, part) => 
      acc && acc[part] !== undefined && acc[part] !== null ? acc[part] : null, obj) || fallback;
  } catch (e) {
    return fallback;
  }
};

/**
 * LiveKitIntegration - Provides real-time voice communication
 * Handles room connection, token management, and video conferencing
 */
const LiveKitIntegration: React.FC<LiveKitIntegrationProps> = ({ session }) => {
  const [token, setToken] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  
  const {
    setError,
  } = useVoiceChatStore();

  // Reset component state when session changes
  useEffect(() => {
    // Clear state when component unmounts or session changes
    return () => {
      setToken('');
      setIsError(false);
    };
  }, [session]);

  // Get LiveKit token
  useEffect(() => {
    // Don't try if we already know there's an error
    if (isError) return;
    
    // Skip if no session
    if (!session) {
      console.warn('No session available for LiveKit integration');
      return;
    }
    
    // Memory efficient - use a local variable to track component mounting state
    let isMounted = true;
    
    // Fetch a LiveKit token for the user
    const getToken = async () => {
      try {
        // Double-check session is still valid
        if (!session || !isMounted) return;
        
        // Extra safety checks for user data
        const user = safeGet(session, 'user') as User | null;
        if (!user) {
          console.warn('Session has no user data for token generation');
          if (isMounted) {
            setToken('');
          }
          return;
        }
        
        // Generate a username with multiple safeguards
        // Use unique random ID to prevent collisions
        const timestamp = Date.now();
        const randomId = Math.floor(Math.random() * 100000);
        
        // Get user identifiers with safe access
        const name = safeGet(user, 'name', '');
        const email = safeGet(user, 'email', '');
        const id = safeGet(user, 'id', '') || safeGet(user, 'sub', '');
        
        // Create username with fallbacks
        const username = 
          (name && typeof name === 'string' ? name : '') || 
          (email && typeof email === 'string' ? email : '') || 
          (id && typeof id === 'string' ? id : '') ||
          `anonymous_${randomId}_${timestamp}`;
        
        // Clean username to remove any special characters
        const cleanUsername = username.replace(/[^\w\s]/gi, '').substring(0, 32);
        
        console.log(`Attempting to get LiveKit token for user: ${cleanUsername}`);
        
        // Don't continue if component unmounted during async operation
        if (!isMounted) return;
        
        const response = await fetch('/api/get-livekit-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: cleanUsername,
            room: 'everleigh-voice-room',
          }),
        });
        
        // Don't continue if component unmounted during async operation
        if (!isMounted) return;
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to get token: ${response.status} ${errorData.error || ''}`);
        }
        
        const data: { token: string } = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setToken(data.token);
          console.log('LiveKit token obtained successfully');
        }
      } catch (error: any) {
        console.error('Error fetching token:', error);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setIsError(true);
          setError(`Failed to connect to voice service: ${error.message}`);
        }
      }
    };

    // Start token fetching
    getToken();
    
    // Cleanup function to prevent memory leaks and race conditions
    return () => {
      isMounted = false;
    };
  }, [session, setError, isError]);

  // Don't render anything if there's no token or an error occurred
  if (!token || isError) {
    return null;
  }

  // Memory-optimized rendering
  return (
    <div className="livekit-container">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
        options={{
          publishDefaults: {
            simulcast: true,
            videoSimulcastLayers: [{ 
              width: 320, 
              height: 240, 
              resolution: 'qvga',
              encoding: { 
                maxBitrate: 150_000, 
                maxFramerate: 15 
              } 
            }],
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