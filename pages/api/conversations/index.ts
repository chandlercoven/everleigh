/**
 * API endpoint for retrieving and creating conversations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/modern-auth';
// Fix to use CommonJS destructuring
const redisService = require('../../../lib/redis-service');
import dbConnect from '../../../lib/mongoose';
import { ObjectId } from 'mongodb';

// Auth request interface with user information
interface AuthRequest extends NextApiRequest {
  auth?: {
    user: {
      id: string;
      [key: string]: any;
    };
  };
}

// Conversation interface
interface Conversation {
  _id?: ObjectId;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

// Message interface
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Success response interface
interface SuccessResponse {
  success: true;
  data: any;
  source?: 'cache' | 'database';
}

// Error response interface
interface ErrorResponse {
  error: string;
  message?: string;
}

// Cache settings
const CACHE_TTL = 60; // 1 minute
const CACHE_KEY_PREFIX = 'conversations';

// API handler with authentication
async function handler(
  req: AuthRequest, 
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  try {
    if (req.method === 'GET') {
      return await getConversations(req, res);
    } else if (req.method === 'POST') {
      return await createConversation(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Conversations API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Get all conversations for the authenticated user
 */
async function getConversations(
  req: AuthRequest, 
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  const { user } = req.auth || {};
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = user.id;
  const cacheKey = `${CACHE_KEY_PREFIX}:${userId}`;

  try {
    // Try to get from cache first
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        source: 'cache'
      });
    }

    // No cached data, get from database
    const client = await dbConnect();
    const db = client.db();
    const conversations = await db
      .collection('conversations')
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();

    // Cache the result
    await redisService.set(cacheKey, conversations, CACHE_TTL);

    return res.status(200).json({
      success: true,
      data: conversations,
      source: 'database'
    });
  } catch (error: any) {
    console.error('Error getting conversations:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve conversations',
      message: error.message
    });
  }
}

/**
 * Create a new conversation
 */
async function createConversation(
  req: AuthRequest, 
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  const { user } = req.auth || {};
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, initialMessage } = req.body as { title: string; initialMessage?: string };
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const client = await dbConnect();
    const db = client.db();
    
    // Create the conversation
    const now = new Date();
    const conversation: Conversation = {
      userId: user.id,
      title,
      createdAt: now,
      updatedAt: now,
      messages: initialMessage ? [{
        role: 'user',
        content: initialMessage,
        timestamp: now
      }] : []
    };

    const result = await db.collection('conversations').insertOne(conversation);
    
    // Invalidate cache
    const cacheKey = `${CACHE_KEY_PREFIX}:${user.id}`;
    await redisService.del(cacheKey);

    return res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...conversation
      }
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ 
      error: 'Failed to create conversation',
      message: error.message
    });
  }
}

export default withAuth(handler); 