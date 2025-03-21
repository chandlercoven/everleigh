import { getAvailableVoices } from '../../lib/elevenlabs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing ElevenLabs API key' });
    }

    // Get available voices from ElevenLabs
    const voices = await getAvailableVoices();

    return res.status(200).json({
      success: true,
      data: voices
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    return res.status(500).json({ error: 'Failed to fetch voices' });
  }
} 