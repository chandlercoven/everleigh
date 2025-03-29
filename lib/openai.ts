// OpenAI API client for Everleigh AI
import OpenAI from 'openai';

// Check if the API key is set
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. OpenAI API calls will fail.');
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a chat completion with GPT-4o
 * @param {string} prompt - The user's prompt
 * @param {string} systemPrompt - The system prompt that defines the assistant's behavior
 * @returns {Promise<string>} - The generated response
 */
export async function generateChatCompletion(prompt: string, systemPrompt = 'You are Everleigh, a helpful voice assistant.'): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw new Error(`Failed to generate response from OpenAI: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert speech to text using OpenAI's Whisper API
 * @param {File|Blob} audioFile - The audio file to transcribe
 * @returns {Promise<string>} - The transcribed text
 */
export async function transcribeSpeech(audioFile: Blob | File): Promise<string> {
  try {
    // Validate input
    if (!audioFile || audioFile.size === 0) {
      throw new Error('Invalid or empty audio file');
    }

    // Log audio details for debugging
    console.log(`Transcribing audio: ${audioFile.size} bytes, type: ${audioFile.type}`);

    // Try to create a Node.js File object from the browser Blob/File
    // This is needed because OpenAI's API expects a different format in Node.js vs browser
    const fileObj = new File([audioFile], 'audio.webm', { type: audioFile.type });

    const response = await openai.audio.transcriptions.create({
      file: fileObj,
      model: 'whisper-1',
    });

    if (!response.text) {
      throw new Error('Received empty transcription from OpenAI');
    }

    return response.text;
  } catch (error) {
    console.error('Error transcribing speech:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to transcribe audio';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
      
      // Add specific error handling for common OpenAI errors
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key error. Please check your API configuration.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
      } else if (error.message.includes('file format')) {
        errorMessage = 'Unsupported audio format. Please use a supported format like MP3, WAV, or WebM.';
      }
    }
    
    throw new Error(errorMessage);
  }
}

export default openai; 