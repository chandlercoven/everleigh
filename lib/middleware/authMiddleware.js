import { getAuthUser } from '../simpleAuth';

/**
 * Authentication middleware for Next.js API routes
 * Checks if the user is authenticated and adds the user to the request object
 * 
 * @param {Function} handler - The API route handler function
 * @returns {Function} - A wrapped handler function with authentication
 */
export function withAuth(handler) {
  return async (req, res) => {
    // Check for authentication
    const user = getAuthUser(req);
    
    // If no user, return unauthorized
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Add user to request object and proceed
    req.user = user;
    return handler(req, res);
  };
}

/**
 * Optional authentication middleware for Next.js API routes
 * Checks if the user is authenticated and adds the user to the request object if available
 * Does not require authentication to proceed
 * 
 * @param {Function} handler - The API route handler function
 * @returns {Function} - A wrapped handler function with optional authentication
 */
export function withOptionalAuth(handler) {
  return async (req, res) => {
    // Check for authentication
    const user = getAuthUser(req);
    
    // Add user to request object if available
    if (user) {
      req.user = user;
    }
    
    // Always proceed to the handler
    return handler(req, res);
  };
} 