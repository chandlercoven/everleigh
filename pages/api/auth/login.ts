import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, generateToken } from '../../../lib/simpleAuth';

/**
 * Login request body shape
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login success response shape
 */
interface LoginSuccessResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

/**
 * Login error response shape
 */
interface LoginErrorResponse {
  error: string;
}

/**
 * Login handler - Authenticates users with email/password
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<LoginSuccessResponse | LoginErrorResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body as LoginRequest;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user information and token
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 