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
    throw new Error('Failed to transcribe audio');
  }
}

export default openai; 