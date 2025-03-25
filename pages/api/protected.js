import { withAuth } from '../../lib/middleware/authMiddleware';

/**
 * Protected endpoint that requires authentication
 */
async function handler(req, res) {
  try {
    // Use optional chaining for better null safety
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'User information not available'
      });
    }

    const { id, name, email } = req.user || {};
    
    console.log(`Protected endpoint accessed by user: ${id} (${email})`);
    
    return res.status(200).json({
      message: 'This is a protected endpoint',
      user: { id, name, email },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in protected endpoint:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
}

// Wrap the handler with the authentication middleware
export default withAuth(handler); 