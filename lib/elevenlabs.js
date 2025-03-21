// ElevenLabs API client for voice synthesis

/**
 * Convert text to speech using ElevenLabs API
 * @param {string} text - The text to convert to speech
 * @param {string} voiceId - The ID of the voice to use (defaults to a female voice)
 * @returns {Promise<ArrayBuffer>} - The audio data as ArrayBuffer
 */
export async function textToSpeech(text, voiceId = 'pNInz6obpgDQGcFmaJgB') {
  // Check if API key is set
  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn('Warning: ELEVENLABS_API_KEY is not set. ElevenLabs API calls will fail.');
    throw new Error('ElevenLabs API key is not configured');
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorData ? JSON.stringify(errorData) : response.statusText}`);
    }

    // Get the audio data as ArrayBuffer
    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error('Error generating speech with ElevenLabs:', error);
    throw new Error('Failed to generate speech with ElevenLabs');
  }
}

/**
 * Get available voices from ElevenLabs
 * @returns {Promise<Array>} - List of available voices
 */
export async function getAvailableVoices() {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn('Warning: ELEVENLABS_API_KEY is not set. ElevenLabs API calls will fail.');
    throw new Error('ElevenLabs API key is not configured');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorData ? JSON.stringify(errorData) : response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    throw new Error('Failed to fetch available voices from ElevenLabs');
  }
} 