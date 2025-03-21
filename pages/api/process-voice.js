// This is a placeholder for a real voice processing API
// In a production environment, this would integrate with n8n and LiveKit

import { generateChatCompletion } from '../../lib/openai';
import { withAuth } from '../../lib/auth';
import { 
  createConversation, 
  addMessage, 
  getConversation 
} from '../../lib/database';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId, isGuest } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing OpenAI API key' });
    }

    // For guest users
    let userId, userName;
    
    if (isGuest) {
      // Use guest identifiers
      userId = 'guest-user';
      userName = 'Guest';
    } else {
      // Access the authenticated user
      if (!req.user) {
        return res.status(401).json({ error: 'Please sign in to use voice features' });
      }
      userId = req.user.id;
      userName = req.user.name || 'User';
    }

    // Detect intent using simple rules
    const intent = detectIntent(message);

    // Generate response using OpenAI
    const systemPrompt = getSystemPromptForIntent(intent, userName);
    const aiResponse = await generateChatCompletion(message, systemPrompt);

    // For guest users, don't store conversation in database
    if (isGuest) {
      return res.status(200).json({
        success: true,
        response: aiResponse,
        intent,
        timestamp: new Date().toISOString()
      });
    }

    // Handle conversation storage for authenticated users
    let conversation;
    
    if (conversationId) {
      // Check if conversation exists and belongs to user
      conversation = await getConversation(conversationId);
      
      if (!conversation || conversation.userId !== userId) {
        // Create a new conversation if not found or not owned
        conversation = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`);
      }
    } else {
      // Create a new conversation
      conversation = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`);
    }
    
    // Add user message
    await addMessage(conversation._id.toString(), 'user', message);
    
    // Add assistant response
    const updatedConversation = await addMessage(conversation._id.toString(), 'assistant', aiResponse);

    const response = {
      success: true,
      response: aiResponse,
      intent,
      conversationId: updatedConversation._id.toString(),
      timestamp: new Date().toISOString()
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
function getSystemPromptForIntent(intent, userName = 'User') {
  const basePrompt = `You are Everleigh, a helpful voice assistant for ${userName}. `;
  
  switch (intent) {
    case 'weather':
      return basePrompt + 'The user is asking about weather. Explain that you do not have real-time weather data yet, but this would be integrated in a production version.';
    case 'time':
      return basePrompt + 'The user is asking about time or date. Respond with the current time and date based on your knowledge cutoff, explaining that in production this would use the server time.';
    case 'help':
      return basePrompt + 'The user is asking for help. Provide a brief overview of your capabilities as a voice AI assistant.';
    default:
      return basePrompt + 'Be concise and friendly in your responses. If you don\'t know something, say so clearly.';
  }
}

// Export with authentication middleware, but skip auth check
// in the handler for guest users
export default withAuth(handler); 