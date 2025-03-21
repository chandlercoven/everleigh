import { createRoom } from '../../lib/livekit-server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Check for LiveKit credentials
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      console.error('LiveKit API credentials not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing LiveKit credentials' });
    }

    // Create the room
    const result = await createRoom(roomName);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
} 