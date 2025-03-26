import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from "../pages/api/auth/[...nextauth]";

/**
 * Modern authentication middleware using Next.js middleware pattern
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
 * Use with the newer Route Handler pattern
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
      const { isGuest } = await request.json().catch(() => ({}));
      if (isGuest === true) {
        return handler(request, context);
      }

      if (!session) {
        // Return appropriate unauthorized response
        return Response.json({ 
          error: "Unauthorized", 
          message: "Authentication required for this endpoint" 
        }, { status: 401 });
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