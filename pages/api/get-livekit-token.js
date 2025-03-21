// This is a placeholder for a real token generation endpoint
// In a production environment, you would use the LiveKit server SDK
// to generate secure tokens with proper authentication

import { createToken } from '../../lib/livekit-server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, room } = req.body;

    if (!username || !room) {
      return res.status(400).json({ error: 'Username and room are required' });
    }

    // Check for LiveKit credentials
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      console.error('LiveKit API credentials not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing LiveKit credentials' });
    }

    // Generate token using our utility function
    const token = createToken(username, room);

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
} 