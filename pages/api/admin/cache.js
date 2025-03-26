/**
 * Cache management API endpoint for administrators
 */
import { withAuth } from '../../../lib/modern-auth';
import { apiLimiter } from '../../../lib/middleware/rateLimiter';
import redisClient, { flush, del } from '../../../lib/redis-cache';

// Apply the API rate limiter
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

async function handler(req, res) {
  // Only admin users can access this endpoint
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }

  // GET request to retrieve cache statistics
  if (req.method === 'GET') {
    try {
      const keys = await redisClient.keys('*');
      const info = await redisClient.info();
      
      return res.status(200).json({
        success: true,
        data: {
          info,
          keyCount: keys.length,
          keys: keys.slice(0, 100), // Only return the first 100 keys to avoid overwhelming response
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get Redis statistics'
      });
    }
  }
  
  // POST request to clear the cache
  if (req.method === 'POST') {
    const { action } = req.body;
    
    if (action === 'flush') {
      await flush();
      
      return res.status(200).json({
        success: true,
        message: 'Cache flushed successfully'
      });
    }
    
    if (action === 'delete' && req.body.key) {
      const deleted = await del(req.body.key);
      
      return res.status(200).json({
        success: true,
        message: deleted ? 'Key deleted successfully' : 'Key not found in cache'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Invalid action. Supported actions: flush, delete'
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

// Apply rate limiting and authentication
export default apiLimiter.sensitive(withAuth(handler)); 