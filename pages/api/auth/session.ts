import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '../../../lib/simpleAuth';

/**
 * Session response shape
 */
interface SessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  error?: string;
}

/**
 * Session handler - Returns information about the current authenticated user session
 */
export default function handler(
  req: NextApiRequest, 
  res: NextApiResponse<SessionResponse>
) {
  try {
    // Get the authenticated user from the request
    const user = getAuthUser(req);
    
    // If no user is authenticated, return empty session
    if (!user) {
      return res.status(200).json({ user: null });
    }
    
    // Return the user information
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ 
      user: null,
      error: 'Internal server error' 
    });
  }
} 