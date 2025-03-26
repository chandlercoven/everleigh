import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from "../pages/api/auth/[...nextauth]";

/**
 * Modern authentication middleware for API Route Handlers
 * Enhanced with improved error handling and type safety
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

      // Use more reliable API request detection
      const isApiRequest = req.headers['x-requested-with'] === 'XMLHttpRequest' 
        || req.headers['accept']?.includes('application/json')
        || req.url.startsWith('/api/');
      
      // Get the session using the optimized getServerSession
      const session = await getServerSession(req, res, authOptions);

      // For routes that allow guest access via isGuest parameter
      const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (requestBody && requestBody.isGuest === true) {
        return handler(req, res);
      }

      if (!session) {
        // Log unauthorized access for monitoring
        console.warn(`Unauthorized access attempt: ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
        
        // For API requests, return 401 status with JSON
        if (isApiRequest) {
          return res.status(401).json({ 
            error: "Unauthorized", 
            message: "Authentication required for this endpoint",
            redirect: "/api/auth/signin"
          });
        }
        
        // For page requests, redirect to login with callback
        return NextResponse.redirect(
          new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(req.url)}`, req.url)
        );
      }

      // Log successful API access for protected endpoints
      if (process.env.NODE_ENV === 'production') {
        console.log(`Protected endpoint accessed by user: ${session.user?.id} (${session.user?.email})`);
      }

      // Add user to request object with typed safety
      req.user = session.user;
      
      return handler(req, res);
    } catch (error) {
      console.error(`[Auth] Error in authentication middleware:`, error);
      
      return res.status(500).json({ 
        error: "Authentication error", 
        message: process.env.NODE_ENV === 'development' ? error.message : "An unexpected error occurred"
      });
    }
  };
}

/**
 * Modern middleware for Route Handlers API in Next.js App Router
 * Use with the newer Route Handler pattern (/app directory)
 */
export function withAuthRouteHandler(handler) {
  return async (request, context) => {
    try {
      // Handle preflight OPTIONS requests for CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
          }
        });
      }

      // Use NextAuth.js session management
      const session = await getServerSession(authOptions);

      // For routes that allow guest access
      const requestData = await request.clone().json().catch(() => ({}));
      if (requestData.isGuest === true) {
        return handler(request, context);
      }

      if (!session) {
        // Log unauthorized access for monitoring
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        console.warn(`[App Router] Unauthorized access attempt: ${request.method} ${request.url} from ${clientIp}`);
        
        // Return appropriate unauthorized response
        return Response.json({ 
          error: "Unauthorized", 
          message: "Authentication required for this endpoint",
          redirect: "/api/auth/signin"
        }, { status: 401 });
      }

      // Log successful API access for protected endpoints
      if (process.env.NODE_ENV === 'production') {
        console.log(`[App Router] Protected endpoint accessed by user: ${session.user?.id} (${session.user?.email})`);
      }

      // Create a new request with the user info attached to its context
      const requestWithUser = new Request(request);
      requestWithUser.user = session.user;
      
      return handler(requestWithUser, context);
    } catch (error) {
      console.error(`[Auth] Error in route handler middleware:`, error);
      
      return Response.json({ 
        error: "Authentication error", 
        message: process.env.NODE_ENV === 'development' ? error.message : "An unexpected error occurred" 
      }, { status: 500 });
    }
  };
}

/**
 * Get the current user session
 * For API Routes or Server Components
 */
export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('[Auth] Error getting session:', error);
    return null;
  }
}

/**
 * Check if the request is authenticated
 * For API Routes or Server Components
 */
export async function isAuthenticated() {
  try {
    const session = await getServerSession(authOptions);
    return !!session;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Get the current user data
 * For API Routes or Server Components
 * @returns {Object|null} User data or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user || null;
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
}

/**
 * Check if current user has a specific role
 * @param {string|Array<string>} roles - Role or array of roles to check
 * @returns {Promise<boolean>} - Whether user has the specified role
 */
export async function hasRole(roles) {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // Convert single role to array for consistent handling
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has any of the specified roles
    return rolesToCheck.some(role => 
      user.role === role || 
      (user.roles && user.roles.includes(role))
    );
  } catch (error) {
    console.error('[Auth] Error checking user role:', error);
    return false;
  }
} 