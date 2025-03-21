/**
 * API endpoint to trigger n8n workflows
 */

import { withAuth } from '../../../lib/auth';

// Map of supported workflow types to their n8n webhook URLs
// In a production environment, this would be stored in a database or environment variables
const WORKFLOW_WEBHOOKS = {
  weather: process.env.N8N_WEATHER_WEBHOOK || 'https://n8n.example.com/webhook/weather',
  calendar: process.env.N8N_CALENDAR_WEBHOOK || 'https://n8n.example.com/webhook/calendar',
  reminder: process.env.N8N_REMINDER_WEBHOOK || 'https://n8n.example.com/webhook/reminder',
  email: process.env.N8N_EMAIL_WEBHOOK || 'https://n8n.example.com/webhook/email',
};

// Base URL for our callback endpoint
// In production, this would be the actual domain of the application
const CALLBACK_URL = process.env.NEXTAUTH_URL 
  ? `${process.env.NEXTAUTH_URL}/api/workflows/callback` 
  : 'http://localhost:3000/api/workflows/callback';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflowType, data, conversationId } = req.body;

    if (!workflowType || !conversationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if the requested workflow type is supported
    if (!WORKFLOW_WEBHOOKS[workflowType]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported workflow type: ${workflowType}`
      });
    }

    // Get the authenticated user
    const userId = req.user.id;

    // Prepare the payload for n8n
    const payload = {
      userId,
      conversationId,
      data: data || {},
      callbackUrl: CALLBACK_URL,
      timestamp: new Date().toISOString()
    };

    // Trigger the n8n workflow by sending a request to its webhook
    const webhookUrl = WORKFLOW_WEBHOOKS[workflowType];
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger workflow: ${response.statusText}`);
    }

    // Return task ID or other identifier for tracking
    const responseData = await response.json();
    
    return res.status(200).json({
      success: true,
      data: {
        message: `${workflowType} workflow triggered successfully`,
        taskId: responseData.taskId || `task_${Date.now()}`,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow'
    });
  }
}

export default withAuth(handler); 