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

// Validate the API key with a lightweight test call
(async function validateApiKey() {
  // Skip validation in test environment or when explicitly disabled
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_API_VALIDATION === 'true') {
    return;
  }

  // Skip if API key is obviously missing
  if (!process.env.OPENAI_API_KEY) {
    return;
  }

  try {
    // Make a minimal API call to verify the key works
    await openai.models.list();
    console.log('✅ OpenAI API key validated successfully');
  } catch (error) {
    let errorMessage = 'Failed to validate OpenAI API key';
    
    // Extract more detailed error information
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        errorMessage = '❌ CRITICAL: Invalid OpenAI API key - Authentication failed';
      } else if (status === 403) {
        errorMessage = '❌ CRITICAL: OpenAI API key does not have permission to access models';
      } else if (status === 429) {
        errorMessage = '⚠️ WARNING: OpenAI rate limit exceeded during API key validation';
      } else {
        errorMessage = `⚠️ WARNING: OpenAI API returned error ${status}: ${error.response.data?.error?.message || 'Unknown error'}`;
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = '⚠️ WARNING: Network error connecting to OpenAI API - check connectivity';
    }
    
    // Log the error in a way that's highly visible
    console.error('\x1b[31m%s\x1b[0m', errorMessage);
    console.error('OpenAI API error details:', error.message || 'Unknown error');
  }
})();

/**
 * Generate a chat completion with GPT-4o
 * @param {string} prompt - The user's prompt
 * @param {string} systemPrompt - The system prompt that defines the assistant's behavior
 * @returns {Promise<string>} - The generated response
 */
export async function generateChatCompletion(prompt, systemPrompt = 'You are Everleigh, a helpful voice assistant.') {
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

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw new Error('Failed to generate response from OpenAI');
  }
}

/**
 * Convert speech to text using OpenAI's Whisper API
 * @param {File|Blob} audioFile - The audio file to transcribe
 * @returns {Promise<string>} - The transcribed text
 */
export async function transcribeSpeech(audioFile) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return response.text;
  } catch (error) {
    console.error('Error transcribing speech:', error);
    
    // Provide more specific error messages based on error type
    if (error.response?.status === 401) {
      throw new Error('OpenAI API key error. Please check your API configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.message.includes('file format')) {
      throw new Error('Unsupported audio format. Please use a supported format like MP3, WAV, or WebM.');
    }
    
    throw new Error('Failed to transcribe audio');
  }
}

export default openai; 