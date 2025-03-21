// LiveKit server configuration and utilities

import { AccessToken } from 'livekit-server-sdk';

/**
 * Create a LiveKit access token for a user
 * @param {string} userId - The user's ID or identity
 * @param {string} roomName - The room to join
 * @returns {string} - JWT token for LiveKit access
 */
export function createToken(userId, roomName) {
  // Check for required configuration
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error('LiveKit server configuration is missing');
  }

  // Create a token with the user's identity
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: userId,
    }
  );

  // Add permission to join the room
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  // Convert to JWT format
  return token.toJwt();
}

/**
 * Create a LiveKit room
 * Note: This would typically be done through the LiveKit Cloud API or a self-hosted LiveKit server
 * @param {string} roomName - The name of the room to create
 */
export async function createRoom(roomName) {
  // This would need to be implemented with the LiveKit admin API
  // Example with a REST client:
  /*
  const response = await fetch(`${process.env.LIVEKIT_API_URL}/rooms/${roomName}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + createAdminToken(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      emptyTimeout: 300, // 5 minutes
      maxParticipants: 50,
    }),
  });
  return response.json();
  */
  
  // For demonstration, just return a success response
  return {
    name: roomName,
    created: true,
  };
}

/**
 * Create an admin token for LiveKit server management
 * @returns {string} - Admin JWT token
 */
function createAdminToken() {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: 'admin',
      name: 'Server Admin',
    }
  );
  
  token.addGrant({
    roomCreate: true,
    roomList: true,
    roomAdmin: true,
  });
  
  return token.toJwt();
} 