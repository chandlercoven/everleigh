import { withAuth } from '../../../lib/auth';
import { 
  getConversation, 
  addMessage,
  deleteConversation,
  updateConversationTitle
} from '../../../lib/database';
import { cacheMiddleware } from '../../../lib/middleware/cacheMiddleware';
import { apiLimiter } from '../../../lib/middleware/rateLimiter';
import { del } from '../../../lib/cache';

async function handler(req, res) {
  const conversationId = req.query.id;
  const userId = req.user.id;

  try {
    // Check if conversation exists and belongs to user
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // GET conversation details
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          conversation
        }
      });
    }
    
    // POST to add a message
    if (req.method === 'POST') {
      const { content, role = 'user' } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }
      
      const updatedConversation = await addMessage(conversationId, role, content);
      
      // Invalidate caches related to this conversation
      invalidateConversationCaches(userId, conversationId);
      
      return res.status(201).json({
        success: true,
        data: {
          conversation: updatedConversation,
          message: updatedConversation.messages[updatedConversation.messages.length - 1]
        }
      });
    }
    
    // PATCH to update conversation
    if (req.method === 'PATCH') {
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Title is required'
        });
      }
      
      const updatedConversation = await updateConversationTitle(conversationId, title);
      
      // Invalidate caches related to this conversation
      invalidateConversationCaches(userId, conversationId);
      
      return res.status(200).json({
        success: true,
        data: {
          conversation: updatedConversation
        }
      });
    }
    
    // DELETE conversation
    if (req.method === 'DELETE') {
      await deleteConversation(conversationId);
      
      // Invalidate caches related to this conversation
      invalidateConversationCaches(userId, conversationId);
      
      return res.status(200).json({
        success: true,
        data: {
          message: 'Conversation deleted successfully'
        }
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling conversation request:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error processing request'
    });
  }
}

/**
 * Helper function to invalidate conversation-related caches
 */
function invalidateConversationCaches(userId, conversationId) {
  // Clear conversation list cache patterns
  const cacheKeys = [
    `api:short:path:/api/conversations`,
    `api:short:path:/api/conversations?`, 
    `api:standard:path:/api/conversations/${conversationId}`
  ];
  
  cacheKeys.forEach(keyPattern => {
    // Use cache.keys() to find all keys that start with the pattern
    const keys = Object.keys(require('../../../lib/cache').default.getStats().keys)
      .filter(key => key.startsWith(keyPattern));
    
    // Delete all matching keys
    keys.forEach(key => del(key));
  });
}

// Apply middleware chain
export default apiLimiter.standard(
  cacheMiddleware.standard(
    withAuth(handler)
  )
); 