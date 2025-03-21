import { textToSpeech } from '../../lib/elevenlabs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Check for ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing ElevenLabs API key' });
    }

    // Generate speech using ElevenLabs
    const audioBuffer = await textToSpeech(text, voiceId);

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
    
    // Send the audio data as the response
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error generating speech:', error);
    return res.status(500).json({ error: 'Failed to generate speech' });
  }
} 