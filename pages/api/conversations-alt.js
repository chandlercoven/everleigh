/**
 * Alternative API endpoint for conversations that avoids Redis
 */

import { MongoClient } from 'mongodb';

// Connection URI
const uri = process.env.MONGODB_URI || "mongodb://mongodb:27017/everleigh";

// Database Name
const dbName = 'everleigh';

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Add CORS headers for other requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Skip authentication for this diagnostic endpoint
  const userId = "system-test-user";
  
  if (req.method === 'GET') {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      
      const db = client.db(dbName);
      
      // Get limited conversations (no auth)
      const conversations = await db
        .collection('conversations')
        .find({})
        .limit(10)
        .sort({ updatedAt: -1 })
        .toArray();
      
      await client.close();
      
      return res.status(200).json({
        success: true,
        message: "This is the alternative API that doesn't use Redis",
        data: conversations,
        debug: {
          mongoUrl: uri.replace(/mongodb:\/\/([^:]+:[^@]+@)?/, 'mongodb://***:***@'),
          timestamp: new Date().toISOString(),
          source: 'direct-mongodb'
        }
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
        message: error.message
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only GET requests are supported on this endpoint'
    });
  }
} 