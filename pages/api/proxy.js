/**
 * Simple proxy to allow direct access to MongoDB for conversations
 * This endpoint is designed to be extremely simple with no imports to avoid minification issues
 */
 
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Simple health check mode
    if (req.query.mode === 'health') {
      return res.status(200).json({
        status: 'ok',
        message: 'Direct proxy available',
        timestamp: new Date().toISOString(),
        url: req.url
      });
    }
    
    // Full database info
    const dbInfo = {
      MONGODB_URI: process.env.MONGODB_URI,
      REDIS_URL: process.env.REDIS_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    // Database must be connected directly (no imports to avoid minification)
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    
    // Get all conversations
    await client.connect();
    const db = client.db();
    const conversations = await db.collection('conversations')
      .find({})
      .limit(5)
      .sort({ updatedAt: -1 })
      .toArray();
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      mode: 'direct-mongodb',
      message: 'Proxy API working correctly',
      count: conversations.length,
      timestamp: new Date().toISOString(),
      config: {
        dbName: db.databaseName,
        mongodb: process.env.MONGODB_URI.replace(/mongodb:\/\/([^:]+:[^@]+@)?/, 'mongodb://***:***@')
      },
      data: conversations.map(doc => ({
        id: doc._id.toString(),
        title: doc.title,
        createdAt: doc.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 