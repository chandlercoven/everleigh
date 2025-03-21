/**
 * Webhook callback API for n8n workflows
 * This endpoint receives results from n8n workflow executions
 */

import { withAuth } from '../../../lib/auth';
import dbConnect from '../../../lib/mongoose';
import Conversation from '../../../lib/models/conversation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { workflowId, taskId, result, conversationId, userId } = req.body;

    if (!workflowId || !result || !conversationId || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Verify the userId matches the authenticated user or has admin rights
    const requestUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (userId !== requestUserId && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to access this conversation' 
      });
    }

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    // Add the workflow result as a message
    conversation.messages.push({
      role: 'assistant',
      content: `Workflow result: ${result}`,
      createdAt: new Date(),
      metadata: {
        workflowId,
        taskId,
        type: 'workflow_result'
      }
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Workflow result processed successfully',
        conversationId
      }
    });
  } catch (error) {
    console.error('Error processing workflow callback:', error);
    return res.status(500).json({
      success: false,
      error: 'Error processing workflow result'
    });
  }
}

export default withAuth(handler); 