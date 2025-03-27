import { withAuth } from '../../../lib/modern-auth';
import dbConnect from '../../../lib/mongoose';
import Conversation from '../../../lib/models/conversation';

async function handler(req, res) {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Check authentication
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be signed in to access conversations'
    });
  }
  
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Invalid user session',
      message: 'User session does not contain a valid ID'
    });
  }

  // Extract conversation ID from URL
  const conversationId = req.query.id;
  
  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Missing conversation ID'
    });
  }
  
  await dbConnect();
  
  // Get conversation
  try {
    // Find the conversation first to check authorization
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    // Check if user is authorized to access this conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this conversation'
      });
    }
    
    // GET - Fetch conversation details
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          conversation: conversation.toObject()
        }
      });
    }
    
    // POST - Add message to conversation
    if (req.method === 'POST') {
      const { role, content } = req.body;
      
      if (!role || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields (role, content)'
        });
      }
      
      // Only allow valid roles
      if (!['user', 'assistant', 'system'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role (must be user, assistant, or system)'
        });
      }
      
      // Add message
      conversation.messages.push({
        role,
        content,
        createdAt: new Date()
      });
      
      conversation.updatedAt = new Date();
      await conversation.save();
      
      return res.status(200).json({
        success: true,
        data: {
          conversation: conversation.toObject()
        }
      });
    }
    
    // PUT - Update conversation title
    if (req.method === 'PUT') {
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Missing title'
        });
      }
      
      conversation.title = title;
      conversation.updatedAt = new Date();
      await conversation.save();
      
      return res.status(200).json({
        success: true,
        data: {
          conversation: conversation.toObject()
        }
      });
    }
    
    // DELETE - Delete conversation
    if (req.method === 'DELETE') {
      await Conversation.deleteOne({ _id: conversationId });
      
      return res.status(200).json({
        success: true,
        data: {
          deleted: true
        }
      });
    }
    
    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });
  } catch (error) {
    console.error(`[Conversation API] Error processing conversation ${conversationId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Apply just authentication middleware
export default withAuth(handler); 