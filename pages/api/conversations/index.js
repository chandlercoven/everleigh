import { withAuth } from '../../../lib/auth';
import { getUserConversations, createConversation } from '../../../lib/database';
import { cacheMiddleware } from '../../../lib/middleware/cacheMiddleware';
import { apiLimiter } from '../../../lib/middleware/rateLimiter';

async function handler(req, res) {
  // Add a specific handler for preflight OPTIONS requests 
  // to prevent redirect loops in CORS scenarios
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Get all conversations for the authenticated user
  if (req.method === 'GET') {
    try {
      // Check if user exists in the request
      if (!req.user) {
        console.error('[Conversations API] User not authenticated');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be signed in to access conversations'
        });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('[Conversations API] No user ID found in request');
        return res.status(401).json({
          success: false,
          error: 'Invalid user session',
          message: 'User session does not contain a valid ID'
        });
      }
      
      // Extract pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      console.log(`[Conversations API] Fetching conversations for user ${userId}, page ${page}, limit ${limit}`);
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        console.warn(`[Conversations API] Invalid pagination parameters: page=${page}, limit=${limit}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }
      
      const result = await getUserConversations(userId, { page, limit });
      
      console.log(`[Conversations API] Successfully fetched ${result?.conversations?.length || 0} conversations for user ${userId}`);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[Conversations API] Error fetching conversations:', error.message, error.stack);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Create a new conversation
  if (req.method === 'POST') {
    try {
      // Check if user exists in the request
      if (!req.user) {
        console.error('[Conversations API] User not authenticated for conversation creation');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be signed in to create conversations'
        });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('[Conversations API] No user ID found in request for conversation creation');
        return res.status(401).json({
          success: false,
          error: 'Invalid user session',
          message: 'User session does not contain a valid ID'
        });
      }
      
      const { title = 'New Conversation' } = req.body;
      
      console.log(`[Conversations API] Creating new conversation with title "${title}" for user ${userId}`);
      
      const conversation = await createConversation(userId, title);
      
      console.log(`[Conversations API] Successfully created conversation ${conversation?._id || conversation?.id} for user ${userId}`);
      
      return res.status(201).json({
        success: true,
        data: {
          conversation
        }
      });
    } catch (error) {
      console.error('[Conversations API] Error creating conversation:', error.message, error.stack);
      return res.status(500).json({
        success: false,
        error: 'Failed to create conversation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  console.warn(`[Conversations API] Method not allowed: ${req.method} for /api/conversations`);
  return res.status(405).json({ 
    error: 'Method not allowed',
    allowedMethods: ['GET', 'POST', 'OPTIONS']
  });
}

// Apply middleware chain: rate limiting for API, caching for GET requests, and authentication
export default apiLimiter.standard(
  cacheMiddleware.short(
    withAuth(handler)
  )
); 