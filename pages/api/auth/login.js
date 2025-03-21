import { authenticateUser, generateToken } from '../../../lib/simpleAuth';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

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
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 