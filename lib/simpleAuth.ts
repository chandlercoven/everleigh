import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import { NextApiRequest } from 'next';

// Configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'everleigh-is-awesome-7ceefbba4dd2652dfae6ec6d216fcebf';
const MONGODB_URI = process.env.MONGODB_URI;

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

interface TokenVerificationResult {
  valid: boolean;
  user?: User;
  error?: string;
}

// In-memory cache for users when database is not available
const MOCK_USERS: User[] = [
  { id: "1", name: "Admin", email: "admin@example.com", password: "password" }
];

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    // Try to authenticate using MongoDB
    if (MONGODB_URI) {
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db();
      const user = await db.collection('users').findOne({ email });
      
      if (user && user.password === password) {
        await client.close();
        return { 
          id: user._id.toString(), 
          name: user.name, 
          email: user.email 
        };
      }
      
      await client.close();
    }
    
    // Fallback to in-memory authentication
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return { id: user.id, name: user.name, email: user.email };
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Fallback to in-memory authentication if database fails
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      return { id: user.id, name: user.name, email: user.email };
    }
    
    return null;
  }
}

export function generateToken(user: User): string {
  const token = jwt.sign(
    { 
      id: user.id,
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  return token;
}

export function verifyToken(token: string): TokenVerificationResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

export function getAuthUser(req: NextApiRequest): User | null {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const { valid, user } = verifyToken(token);
    
    if (!valid || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
} 