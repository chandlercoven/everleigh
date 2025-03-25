/**
 * API utilities for making requests to the backend
 */

/**
 * Fetch all conversations for the authenticated user with pagination
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (starting from 1)
 * @param {number} options.limit - Number of items per page 
 * @returns {Promise<Object>} - Paginated conversations data
 */
export async function fetchConversations(options = {}) {
  const { page = 1, limit = 10 } = options;
  
  try {
    console.log(`Fetching conversations: page=${page}, limit=${limit}`);
    
    // Add cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/conversations?page=${page}&limit=${limit}&_=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Prevent redirect loops by indicating this is an API request
        'X-Requested-With': 'XMLHttpRequest'
      },
      // Don't follow redirects automatically
      redirect: 'error'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Authentication error when fetching conversations');
        throw new Error('You must be signed in to view conversations');
      }
      
      // Try to parse error message from response
      let errorMessage = 'Failed to fetch conversations';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If can't parse JSON, use status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in fetchConversations:', error);
    throw error;
  }
}

/**
 * Fetch a specific conversation by ID
 * @param {string} id - The conversation ID
 * @returns {Promise<Object>} - The conversation
 */
export async function fetchConversation(id) {
  const response = await fetch(`/api/conversations/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Conversation not found');
    }
    throw new Error('Failed to fetch conversation');
  }
  
  const data = await response.json();
  return data.data.conversation;
}

/**
 * Create a new conversation
 * @param {string} title - Optional title for the conversation
 * @returns {Promise<Object>} - The created conversation
 */
export async function createConversation(title = 'New Conversation') {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }
  
  const data = await response.json();
  return data.data.conversation;
}

/**
 * Add a message to a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} content - The message content
 * @param {string} role - The role ('user' or 'assistant')
 * @returns {Promise<Object>} - The updated conversation
 */
export async function addMessage(conversationId, content, role = 'user') {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, role }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add message');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Update a conversation's title
 * @param {string} conversationId - The conversation ID
 * @param {string} title - The new title
 * @returns {Promise<Object>} - The updated conversation
 */
export async function updateConversationTitle(conversationId, title) {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }
  
  const data = await response.json();
  return data.data.conversation;
}

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<void>}
 */
export async function deleteConversation(conversationId) {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }
}

/**
 * Process a voice message
 * @param {string} message - The transcribed message
 * @param {string} conversationId - Optional conversation ID
 * @returns {Promise<Object>} - The processing result
 */
export async function processVoiceMessage(message, conversationId = null) {
  const response = await fetch('/api/process-voice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationId
    }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please sign in to use voice features');
    }
    throw new Error('Failed to process message');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Trigger an n8n workflow
 * @param {string} workflowType - The type of workflow to trigger
 * @param {string} conversationId - The conversation ID
 * @param {Object} data - Additional data for the workflow
 * @returns {Promise<Object>} - The workflow trigger result
 */
export async function triggerWorkflow(workflowType, conversationId, data = {}) {
  const response = await fetch('/api/workflows/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowType,
      conversationId,
      data
    }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please sign in to use workflow features');
    }
    throw new Error(`Failed to trigger ${workflowType} workflow`);
  }
  
  const responseData = await response.json();
  return responseData.data;
}

/**
 * Get available workflow types
 * @returns {Array<string>} - Array of available workflow types
 */
export function getAvailableWorkflowTypes() {
  return ['weather', 'calendar', 'reminder', 'email'];
} 