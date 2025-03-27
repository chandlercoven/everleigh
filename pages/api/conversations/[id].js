import { withAuth } from '../../../lib/modern-auth';
import { 
  getConversation, 
  addMessage,
  deleteConversation,
  updateConversationTitle
} from '../../../lib/database';
// Remove cacheMiddleware temporarily to bypass Redis errors
// import { cacheMiddleware } from '../../../lib/middleware/cacheMiddleware';
import { apiLimiter } from '../../../lib/middleware/rateLimiter';

async function handler(req, res) {
  // Add a specific handler for preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Extract the conversation ID from the URL
  const conversationId = req.query.id;
  
  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Missing conversation ID'
    });
  }
  
  // Get a specific conversation
  if (req.method === 'GET') {
    try {
      const conversation = await getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      
      // Check if the user is authorized to access this conversation
      if (conversation.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          conversation
        }
      });
    } catch (error) {
      console.error(`[Conversation API] Error fetching conversation ${conversationId}:`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation'
      });
    }
  }
  
  // Add a message to a conversation
  if (req.method === 'POST') {
    try {
      const { role, content } = req.body;
      
      if (!role || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields (role, content)'
        });
      }
      
      // Only allow valid roles
      if (!['user', 'assistant', 'system'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role (must be user, assistant, or system)'
        });
      }
      
      // Get the conversation to check ownership
      const conversation = await getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      
      // Check if the user is authorized to access this conversation
      if (conversation.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Add the message
      const updatedConversation = await addMessage(conversationId, role, content);
      
      return res.status(200).json({
        success: true,
        data: {
          conversation: updatedConversation
        }
      });
    } catch (error) {
      console.error(`[Conversation API] Error adding message to conversation ${conversationId}:`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add message'
      });
    }
  }
  
  // Update conversation title
  if (req.method === 'PUT') {
    try {
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Missing title'
        });
      }
      
      // Get the conversation to check ownership
      const conversation = await getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      
      // Check if the user is authorized to access this conversation
      if (conversation.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Update the title
      const updatedConversation = await updateConversationTitle(conversationId, title);
      
      return res.status(200).json({
        success: true,
        data: {
          conversation: updatedConversation
        }
      });
    } catch (error) {
      console.error(`[Conversation API] Error updating conversation ${conversationId}:`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update conversation'
      });
    }
  }
  
  // Delete a conversation
  if (req.method === 'DELETE') {
    try {
      // Get the conversation to check ownership
      const conversation = await getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      
      // Check if the user is authorized to access this conversation
      if (conversation.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Delete the conversation
      const deleted = await deleteConversation(conversationId);
      
      return res.status(200).json({
        success: true,
        data: {
          deleted
        }
      });
    } catch (error) {
      console.error(`[Conversation API] Error deleting conversation ${conversationId}:`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete conversation'
      });
    }
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

// Apply middleware chain: rate limiting for API but bypass caching temporarily
// export default apiLimiter.standard(
//   cacheMiddleware.short(
//     withAuth(handler)
//   )
// );

// Temporarily use without cache middleware
export default apiLimiter.standard(
  withAuth(handler)
); 