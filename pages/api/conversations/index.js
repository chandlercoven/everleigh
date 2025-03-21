import { withAuth } from '../../../lib/auth';
import { getUserConversations, createConversation } from '../../../lib/database';

async function handler(req, res) {
  // Get all conversations for the authenticated user
  if (req.method === 'GET') {
    try {
      const userId = req.user.id;
      const conversations = await getUserConversations(userId);
      
      return res.status(200).json({
        success: true,
        data: {
          conversations
        }
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations'
      });
    }
  }
  
  // Create a new conversation
  if (req.method === 'POST') {
    try {
      const userId = req.user.id;
      const { title = 'New Conversation' } = req.body;
      
      const conversation = await createConversation(userId, title);
      
      return res.status(201).json({
        success: true,
        data: {
          conversation
        }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create conversation'
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler); 