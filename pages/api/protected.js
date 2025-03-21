import { withAuth } from '../../lib/middleware/authMiddleware';

/**
 * Protected endpoint that requires authentication
 */
async function handler(req, res) {
  // We can safely use req.user since withAuth guarantees it exists
  const { id, name, email } = req.user;
  
  return res.status(200).json({
    message: 'This is a protected endpoint',
    user: { id, name, email },
    timestamp: new Date().toISOString()
  });
}

// Wrap the handler with the authentication middleware
export default withAuth(handler); 