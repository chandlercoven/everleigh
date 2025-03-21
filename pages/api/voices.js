import { getAvailableVoices } from '../../lib/elevenlabs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      // Return default voices instead of error to avoid frontend errors
      return res.status(200).json({
        success: true,
        voices: [
          {
            voice_id: 'pNInz6obpgDQGcFmaJgB',
            name: 'Default Voice'
          }
        ]
      });
    }

    // Get available voices from ElevenLabs
    try {
      const voices = await getAvailableVoices();
      
      return res.status(200).json({
        success: true,
        voices: voices
      });
    } catch (elevenlabsError) {
      console.error('ElevenLabs API error:', elevenlabsError);
      // Return default voice on ElevenLabs API error
      return res.status(200).json({
        success: true,
        voices: [
          {
            voice_id: 'pNInz6obpgDQGcFmaJgB',
            name: 'Default Voice'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching voices:', error);
    // Return default voice on any error
    return res.status(200).json({
      success: true,
      voices: [
        {
          voice_id: 'pNInz6obpgDQGcFmaJgB',
          name: 'Default Voice'
        }
      ]
    });
  }
} 