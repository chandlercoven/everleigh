// This is a placeholder for a real voice processing API
// In a production environment, this would integrate with n8n and LiveKit

import { generateChatCompletion } from '../../lib/openai';
import { withAuth } from '../../lib/modern-auth';
import { 
  createConversation, 
  addMessage, 
  getConversation 
} from '../../lib/database';

// Enhanced custom error handling
class APIError extends Error {
  constructor(message, status = 500, code = 'internal_error', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }
}

async function handler(req, res) {
  // Enable detailed debug logging
  const enableDebug = process.env.DEBUG_API === 'true';
  
  // Helper for consistent debug logging
  const logInfo = (message, data = {}) => {
    if (enableDebug) {
      console.log(`[${new Date().toISOString()}] [Voice API] ${message}`, data);
    }
  };
  
  // Log request details
  logInfo('Voice processing request received', { 
    method: req.method,
    path: req.url,
    body: req.body ? { 
      conversationId: req.body.conversationId,
      isGuest: req.body.isGuest,
      messageLength: req.body.message?.length
    } : null,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    }
  });

  // Method validation with detailed response
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: {
        message: 'Method not allowed', 
        code: 'method_not_allowed',
        allowedMethods: ['POST']
      },
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Extract and validate the request data
    const { message, conversationId, isGuest } = req.body;

    // Input validation with detailed errors
    if (!message || typeof message !== 'string') {
      throw new APIError(
        'Message is required and must be a string', 
        400, 
        'invalid_input', 
        { field: 'message' }
      );
    }

    if (message.length > 10000) {
      throw new APIError(
        'Message is too long (max 10000 characters)', 
        400, 
        'input_too_large', 
        { field: 'message', maxLength: 10000, actualLength: message.length }
      );
    }

    // Determine user context (authenticated or guest)
    const userId = req.user?.id || (isGuest ? 'guest' : null);
    if (!userId) {
      throw new APIError(
        'Authentication required to process voice messages', 
        401, 
        'authentication_required'
      );
    }

    // Log the processing attempt
    logInfo('Processing user message', { 
      userId, 
      messageLength: message.length,
      isGuest: !!isGuest,
      hasConversationId: !!conversationId
    });

    // Determine intent (simplified for demo)
    const intent = message.toLowerCase().includes('weather') 
      ? 'weather_query' 
      : message.toLowerCase().includes('remind') 
        ? 'reminder_creation'
        : 'general_conversation';

    logInfo('Detected intent', { intent });

    // Generate a response using OpenAI
    logInfo('Sending message to AI for processing');
    let aiResponse;
    try {
      aiResponse = await generateChatCompletion([
        { role: 'system', content: 'You are a helpful voice assistant named Everleigh.' },
        { role: 'user', content: message }
      ]);
      logInfo('Received AI response', { responseLength: aiResponse.length });
    } catch (aiError) {
      logInfo('AI processing error', { error: aiError.message });
      throw new APIError(
        'Failed to generate AI response', 
        503, 
        'ai_service_error', 
        { serviceError: aiError.message }
      );
    }

    // Handle conversation storage
    let conversation;
    
    try {
      if (conversationId) {
        logInfo('Fetching existing conversation', { conversationId });
        // Check if conversation exists and belongs to user
        conversation = await getConversation(conversationId);
        
        if (!conversation || conversation.userId !== userId) {
          logInfo('Conversation not found or not owned by user, creating new conversation', {
            found: !!conversation,
            ownedByUser: conversation ? conversation.userId === userId : false
          });
          // Create a new conversation if not found or not owned
          conversation = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`);
        }
      } else {
        logInfo('Creating new conversation', { userId });
        // Create a new conversation
        conversation = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`);
      }
      
      logInfo('Adding user message to conversation', { 
        conversationId: conversation._id.toString(),
        messageLength: message.length
      });
      
      // Add user message
      await addMessage(conversation._id.toString(), 'user', message);
      
      logInfo('Adding assistant response to conversation', { 
        conversationId: conversation._id.toString(),
        responseLength: aiResponse.length
      });
      
      // Add assistant response
      const updatedConversation = await addMessage(conversation._id.toString(), 'assistant', aiResponse);

      // Generate the successful response with rich metadata
      const response = {
        success: true,
        status: 'success',
        response: aiResponse,
        intent,
        conversation: {
          id: updatedConversation._id.toString(),
          messageCount: updatedConversation.messages.length,
          created: updatedConversation.createdAt
        },
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - (req.startTime || Date.now())
      };

      logInfo('Successfully processed voice request', { 
        conversationId: updatedConversation._id.toString(),
        responseLength: aiResponse.length
      });
      
      return res.status(200).json(response);
    } catch (dbError) {
      logInfo('Database operation error', { error: dbError.message });
      
      // Even if storage fails, return the AI response to the user
      // but include info about the storage failure
      const response = {
        success: true,
        status: 'partial_success',
        response: aiResponse,
        intent,
        error: {
          message: 'Your message was processed but could not be saved',
          code: 'storage_error',
          details: dbError.message
        },
        timestamp: new Date().toISOString()
      };
      
      return res.status(207).json(response);
    }
  } catch (error) {
    // Enhanced error handling with detailed response
    console.error('Error in voice processing:', error);
    
    // Determine the proper error status and code
    const status = error instanceof APIError ? error.status : 500;
    const errorCode = error instanceof APIError ? error.code : 'internal_server_error';
    const details = error instanceof APIError ? error.details : null;
    
    return res.status(status).json({
      success: false,
      status: 'error',
      error: {
        message: error.message || 'An unexpected error occurred',
        code: errorCode,
        details: details,
        trace: enableDebug ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Export with auth wrapper
export default withAuth(handler, { 
  allowGuest: true,
  requireAuth: false 
}); 