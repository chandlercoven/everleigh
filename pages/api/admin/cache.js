/**
 * Cache management API endpoint for administrators
 */
import { withAuth } from '../../../lib/auth';
import { apiLimiter } from '../../../lib/middleware/rateLimiter';
import cache, { flush, getStats } from '../../../lib/cache';

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
    const stats = getStats();
    const keys = cache.keys();
    
    return res.status(200).json({
      success: true,
      data: {
        stats,
        keyCount: keys.length,
        keys: keys.slice(0, 100), // Only return the first 100 keys to avoid overwhelming response
      }
    });
  }
  
  // POST request to clear the cache
  if (req.method === 'POST') {
    const { action } = req.body;
    
    if (action === 'flush') {
      flush();
      
      return res.status(200).json({
        success: true,
        message: 'Cache flushed successfully'
      });
    }
    
    if (action === 'delete' && req.body.key) {
      const deleted = cache.del(req.body.key);
      
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