// This is a placeholder for a real voice processing API
// In a production environment, this would integrate with n8n and LiveKit

import { generateChatCompletion } from '../../lib/openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing OpenAI API key' });
    }

    // Detect intent using simple rules
    const intent = detectIntent(message);

    // Generate response using OpenAI
    const systemPrompt = getSystemPromptForIntent(intent);
    const aiResponse = await generateChatCompletion(message, systemPrompt);

    const response = {
      success: true,
      data: {
        response: aiResponse,
        intent,
        timestamp: new Date().toISOString()
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error processing voice message:', error);
    return res.status(500).json({ error: 'Failed to process voice message' });
  }
}

// Intent detection with basic rules
function detectIntent(message) {
  const msg = message.toLowerCase();
  if (msg.includes('weather')) {
    return 'weather';
  } else if (msg.includes('time') || msg.includes('date')) {
    return 'time';
  } else if (msg.includes('help')) {
    return 'help';
  }
  return 'general';
}

// Get appropriate system prompt based on detected intent
function getSystemPromptForIntent(intent) {
  switch (intent) {
    case 'weather':
      return 'You are Everleigh, a helpful voice assistant. The user is asking about weather. Explain that you do not have real-time weather data yet, but this would be integrated in a production version.';
    case 'time':
      return 'You are Everleigh, a helpful voice assistant. The user is asking about time or date. Respond with the current time and date based on your knowledge cutoff, explaining that in production this would use the server time.';
    case 'help':
      return 'You are Everleigh, a helpful voice assistant. The user is asking for help. Provide a brief overview of your capabilities as a voice AI assistant.';
    default:
      return 'You are Everleigh, a helpful voice assistant. Be concise and friendly in your responses. If you don\'t know something, say so clearly.';
  }
} 