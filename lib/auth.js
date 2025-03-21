import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

/**
 * Middleware to protect API routes
 * @param {Function} handler - The API route handler
 * @returns {Function} - The wrapped handler with auth check
 */
export function withAuth(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Add user to request object
    req.user = session.user;
    
    return handler(req, res);
  };
}

/**
 * Get the current user session
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object|null} - The session or null if not authenticated
 */
export async function getSession(req, res) {
  return await getServerSession(req, res, authOptions);
}

/**
 * Check if the request is authenticated
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Boolean} - True if authenticated, false otherwise
 */
export async function isAuthenticated(req, res) {
  const session = await getServerSession(req, res, authOptions);
  return !!session;
} 