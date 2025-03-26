// This is a placeholder for a real voice processing API
// In a production environment, this would integrate with n8n and LiveKit

import { generateChatCompletion } from '../../lib/openai';
import { withAuth } from '../../lib/modern-auth';
import { 
  createConversation, 
  addMessage, 
  getConversation 
} from '../../lib/database';

async function handler(req, res) {
  // Log request method and parameters for debugging
  console.log(`[${new Date().toISOString()}] Voice processing request:`, { 
    method: req.method,
    path: req.url,
    body: req.body ? { 
      conversationId: req.body.conversationId,
      isGuest: req.body.isGuest,
      messageLength: req.body.message?.length
    } : null
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowedMethods: ['POST'] });
  }

  try {
    const { message, conversationId, isGuest } = req.body;

    if (!message) {
      console.warn('[Voice API] Missing message parameter');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Voice API] OpenAI API key not configured');
      return res.status(500).json({ error: 'Server misconfiguration - missing OpenAI API key' });
    }

    // For guest users
    let userId, userName;
    
    if (isGuest) {
      // Use guest identifiers
      userId = 'guest-user';
      userName = 'Guest';
      console.log('[Voice API] Processing request for guest user');
    } else {
      // Access the authenticated user
      if (!req?.user) {
        console.warn('[Voice API] Authentication required but user not found in request');
        return res.status(401).json({ error: 'Please sign in to use voice features' });
      }
      userId = req.user?.id || 'unknown-user';
      userName = req.user?.name || 'User';
      console.log(`[Voice API] Processing request for authenticated user: ${userId}`);
    }

    // Detect intent using simple rules
    const intent = detectIntent(message);
    console.log(`[Voice API] Detected intent: ${intent} for message of length ${message.length}`);

    // Generate response using OpenAI
    const systemPrompt = getSystemPromptForIntent(intent, userName);
    console.log('[Voice API] Sending request to OpenAI');
    const aiResponse = await generateChatCompletion(message, systemPrompt);
    console.log('[Voice API] Received response from OpenAI');

    // For guest users, don't store conversation in database
    if (isGuest) {
      console.log('[Voice API] Returning response for guest user (no conversation storage)');
      return res.status(200).json({
        success: true,
        response: aiResponse,
        intent,
        timestamp: new Date().toISOString()
      });
    }

    // Handle conversation storage for authenticated users
    let conversation;
    
    try {
      if (conversationId) {
        console.log(`[Voice API] Fetching existing conversation: ${conversationId}`);
        // Check if conversation exists and belongs to user
        conversation = await getConversation(conversationId);
        
        if (!conversation || conversation.userId !== userId) {
          console.log(`[Voice API] Conversation not found or not owned by user, creating new conversation`);
          // Create a new conversation if not found or not owned
          conversation = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`);
        }
      } else {
        console.log(`[Voice API] Creating new conversation for user: ${userId}`);
        // Create a new conversation
        conversation = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`);
      }
      
      console.log(`[Voice API] Adding user message to conversation: ${conversation._id.toString()}`);
      // Add user message
      await addMessage(conversation._id.toString(), 'user', message);
      
      console.log(`[Voice API] Adding assistant response to conversation: ${conversation._id.toString()}`);
      // Add assistant response
      const updatedConversation = await addMessage(conversation._id.toString(), 'assistant', aiResponse);

      const response = {
        success: true,
        response: aiResponse,
        intent,
        conversationId: updatedConversation._id.toString(),
        timestamp: new Date().toISOString()
      };

      console.log('[Voice API] Successfully processed and stored conversation');
      return res.status(200).json(response);
    } catch (dbError) {
      console.error('[Voice API] Database error:', dbError);
      console.error('[Voice API] Database error stack:', dbError.stack);
      
      // Still return the AI response even if database operations fail
      return res.status(200).json({
        success: true,
        response: aiResponse,
        intent,
        error: 'Failed to store conversation, but response was generated',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error processing voice message:', error);
    console.error('Stack trace:', error.stack);
    console.error('Request data:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body ? { 
        conversationId: req.body.conversationId,
        isGuest: req.body.isGuest,
        messageLength: req.body.message?.length
      } : null
    });
    
    return res.status(500).json({ 
      error: 'Failed to process voice message',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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