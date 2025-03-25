import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

/**
 * Middleware to protect API routes
 * @param {Function} handler - The API route handler
 * @returns {Function} - The wrapped handler with auth check
 */
export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Handle preflight OPTIONS requests for CORS
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        return res.status(200).end();
      }

      // Check if this is an API request (via Ajax/fetch) - useful for preventing redirect loops
      const isApiRequest = req.headers['x-requested-with'] === 'XMLHttpRequest' 
        || req.headers['accept']?.includes('application/json')
        || req.url.startsWith('/api/');
        
      console.log(`[Auth] Processing ${isApiRequest ? 'API' : 'page'} request for ${req.url}`);
      
      // Attempt to get the session
      const session = await getServerSession(req, res, authOptions);

      // Log session info for debugging (hide sensitive data)
      console.log(`[Auth] Session status: ${session ? 'Authenticated' : 'Unauthenticated'}`);
      if (session) {
        console.log(`[Auth] User: ${session.user?.email || 'unknown'}`);
      }

      // For routes that allow guest access via isGuest parameter
      if (req.body && req.body.isGuest === true) {
        console.log(`[Auth] Allowing guest access for: ${req.url}`);
        return handler(req, res);
      }

      if (!session) {
        console.warn(`[Auth] Unauthorized access attempt to ${req.url}`);
        
        // For API requests, return 401 status
        if (isApiRequest) {
          return res.status(401).json({ 
            error: "Unauthorized", 
            details: "Authentication required for this endpoint",
            redirect: "/auth/signin?callbackUrl=" + encodeURIComponent(req.url)
          });
        }
        
        // For regular page requests, redirect to login
        // But we're not doing this as it could cause redirect loops, just returning 401
        return res.status(401).json({ 
          error: "Unauthorized", 
          details: "Authentication required for this endpoint" 
        });
      }

      // Add user to request object with null safety
      req.user = session?.user || null;
      
      return handler(req, res);
    } catch (error) {
      console.error(`[Auth] Error in authentication middleware:`, error);
      console.error(`[Auth] Stack trace:`, error.stack);
      console.error(`[Auth] Request details:`, {
        url: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          authorization: req.headers?.authorization ? '[REDACTED]' : undefined
        }
      });
      
      return res.status(500).json({ 
        error: "Authentication error", 
        message: process.env.NODE_ENV === 'development' ? error.message : "An unexpected error occurred during authentication"
      });
    }
  };
}

/**
 * Get the current user session
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object|null} - The session or null if not authenticated
 */
export async function getSession(req, res) {
  try {
    return await getServerSession(req, res, authOptions);
  } catch (error) {
    console.error('[Auth] Error getting session:', error);
    return null;
  }
}

/**
 * Check if the request is authenticated
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Boolean} - True if authenticated, false otherwise
 */
export async function isAuthenticated(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    return !!session;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    return false;
  }
} 