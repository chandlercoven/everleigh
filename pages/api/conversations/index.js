import { withAuth } from '../../../lib/auth';
import { getUserConversations, createConversation } from '../../../lib/database';
import { cacheMiddleware } from '../../../lib/middleware/cacheMiddleware';
import { apiLimiter } from '../../../lib/middleware/rateLimiter';

async function handler(req, res) {
  // Get all conversations for the authenticated user
  if (req.method === 'GET') {
    try {
      const userId = req.user.id;
      
      // Extract pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }
      
      const result = await getUserConversations(userId, { page, limit });
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations'
      });
    }
  }
  
  // Create a new conversation
  if (req.method === 'POST') {
    try {
      const userId = req.user.id;
      const { title = 'New Conversation' } = req.body;
      
      const conversation = await createConversation(userId, title);
      
      return res.status(201).json({
        success: true,
        data: {
          conversation
        }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create conversation'
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// Apply middleware chain: rate limiting for API, caching for GET requests, and authentication
export default apiLimiter.standard(
  cacheMiddleware.short(
    withAuth(handler)
  )
); 