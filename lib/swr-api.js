/**
 * SWR-based API utilities for data fetching with automatic caching and revalidation
 */
import useSWR, { mutate } from 'swr';

// Default fetcher function for SWR
const defaultFetcher = async (url) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
  
  const data = await response.json();
  return data.data;
};

// Base API paths
const API_PATHS = {
  CONVERSATIONS: '/api/conversations',
  PROCESS_VOICE: '/api/process-voice',
  WORKFLOWS: '/api/workflows',
};

/**
 * Hook to fetch all conversations with pagination
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (starting from 1)
 * @param {number} options.limit - Number of items per page
 */
export function useConversations(options = { page: 1, limit: 10 }) {
  const { page, limit } = options;
  const timestamp = new Date().getTime(); // Cache busting
  const key = `${API_PATHS.CONVERSATIONS}?page=${page}&limit=${limit}&_=${timestamp}`;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, defaultFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0, // No automatic polling
    dedupingInterval: 5000 // Dedupe requests within 5 seconds
  });
  
  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  };
}

/**
 * Hook to fetch a specific conversation by ID
 * @param {string} id - The conversation ID
 */
export function useConversation(id) {
  const key = id ? `${API_PATHS.CONVERSATIONS}/${id}` : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, defaultFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000
  });
  
  return {
    conversation: data?.conversation,
    error,
    isLoading,
    isValidating,
    mutate
  };
}

/**
 * Create a new conversation
 * @param {string} title - Optional title for the conversation
 * @returns {Promise<Object>} - The created conversation
 */
export async function createConversation(title = 'New Conversation') {
  const response = await fetch(API_PATHS.CONVERSATIONS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    const error = new Error('Failed to create conversation');
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  const data = await response.json();
  
  // Revalidate the conversations list
  mutate((key) => typeof key === 'string' && key.startsWith(API_PATHS.CONVERSATIONS));
  
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
  const response = await fetch(`${API_PATHS.CONVERSATIONS}/${conversationId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ content, role }),
  });
  
  if (!response.ok) {
    const error = new Error('Failed to add message');
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  const data = await response.json();
  
  // Update the conversation data locally
  mutate(`${API_PATHS.CONVERSATIONS}/${conversationId}`);
  
  return data.data;
}

/**
 * Update a conversation's title
 * @param {string} conversationId - The conversation ID
 * @param {string} title - The new title
 * @returns {Promise<Object>} - The updated conversation
 */
export async function updateConversationTitle(conversationId, title) {
  const response = await fetch(`${API_PATHS.CONVERSATIONS}/${conversationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    const error = new Error('Failed to update conversation title');
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  const data = await response.json();
  
  // Update the conversation data locally
  mutate(`${API_PATHS.CONVERSATIONS}/${conversationId}`);
  
  // Also update the conversations list if it's cached
  mutate((key) => typeof key === 'string' && key.startsWith(API_PATHS.CONVERSATIONS) && !key.includes(`/${conversationId}`));
  
  return data.data.conversation;
}

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<void>}
 */
export async function deleteConversation(conversationId) {
  const response = await fetch(`${API_PATHS.CONVERSATIONS}/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  if (!response.ok) {
    const error = new Error('Failed to delete conversation');
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  // Remove the conversation from cache
  mutate(`${API_PATHS.CONVERSATIONS}/${conversationId}`, null, false);
  
  // Update the conversations list
  mutate((key) => typeof key === 'string' && key.startsWith(API_PATHS.CONVERSATIONS) && !key.includes(`/${conversationId}`));
}

/**
 * Process a voice message
 * @param {string} message - The transcribed message
 * @param {string} conversationId - Optional conversation ID
 * @returns {Promise<Object>} - The processing result
 */
export async function processVoiceMessage(message, conversationId = null) {
  const response = await fetch(API_PATHS.PROCESS_VOICE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      message,
      conversationId
    }),
  });
  
  if (!response.ok) {
    const error = new Error('Failed to process voice message');
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  const data = await response.json();
  
  // If this updates a conversation, revalidate it
  if (conversationId) {
    mutate(`${API_PATHS.CONVERSATIONS}/${conversationId}`);
  }
  
  return data.data;
}

/**
 * Hook to get all available workflow types
 */
export function useWorkflowTypes() {
  const { data, error, isLoading } = useSWR(`${API_PATHS.WORKFLOWS}/types`, defaultFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000 // Cache for 1 hour
  });
  
  return {
    types: data?.types || ['weather', 'calendar', 'reminder', 'email'],
    error,
    isLoading
  };
}

/**
 * Trigger an n8n workflow
 * @param {string} workflowType - The type of workflow to trigger
 * @param {string} conversationId - The conversation ID
 * @param {Object} data - Additional data for the workflow
 * @returns {Promise<Object>} - The workflow trigger result
 */
export async function triggerWorkflow(workflowType, conversationId, data = {}) {
  const response = await fetch(`${API_PATHS.WORKFLOWS}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      workflowType,
      conversationId,
      data
    }),
  });
  
  if (!response.ok) {
    const error = new Error(`Failed to trigger ${workflowType} workflow`);
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  const responseData = await response.json();
  
  // If this affects a conversation, revalidate it
  if (conversationId) {
    mutate(`${API_PATHS.CONVERSATIONS}/${conversationId}`);
  }
  
  return responseData.data;
} 