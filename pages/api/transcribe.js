import { transcribeSpeech } from '../../lib/openai';
import formidable from 'formidable';
import fs from 'fs';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing OpenAI API key' });
    }

    // Parse the incoming form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    if (!files.audio || files.audio.length === 0) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioFile = files.audio[0];
    
    // Create a Blob from the file
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    const fileBlob = new Blob([audioBuffer], { type: audioFile.mimetype });
    
    // Transcribe the audio using OpenAI Whisper
    const transcription = await transcribeSpeech(fileBlob);
    
    // Clean up the temporary file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json({
      success: true,
      data: {
        transcription,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
} 