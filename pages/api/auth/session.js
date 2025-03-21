import { getAuthUser } from '../../../lib/simpleAuth';

export default function handler(req, res) {
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
    return res.status(500).json({ error: 'Internal server error' });
  }
} 