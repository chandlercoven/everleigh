/**
 * Database service for storing conversations
 * Uses MongoDB with Redis caching for improved performance
 */

import dbConnect from './mongoose';
import Conversation from './models/conversation';
const redisService = require('./redis-service');

// Helper function to delete keys by pattern
async function deleteByPattern(pattern) {
  return await redisService.deleteByPattern?.(pattern) || 0;
}

/**
 * Create a new conversation
 * @param {string} userId - The user ID
 * @param {string} title - The conversation title
 * @returns {Promise<Object>} - The created conversation
 */
export async function createConversation(userId, title = 'New Conversation') {
  await dbConnect();
  
  const conversation = new Conversation({
    userId,
    title,
    messages: []
  });
  
  await conversation.save();
  
  // Invalidate user conversations cache
  await invalidateUserConversationsCache(userId);
  
  return conversation.toObject();
}

/**
 * Add a message to a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} role - The message role (user or assistant)
 * @param {string} content - The message content
 * @returns {Promise<Object|null>} - The updated conversation or null if not found
 */
export async function addMessage(conversationId, role, content) {
  await dbConnect();
  
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    return null;
  }
  
  conversation.messages.push({
    role,
    content,
    createdAt: new Date()
  });
  
  conversation.updatedAt = new Date();
  await conversation.save();
  
  // Invalidate conversation cache
  await invalidateConversationCache(conversationId, conversation.userId);
  
  return conversation.toObject();
}

/**
 * Get a conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} - The conversation or null if not found
 */
export const getConversation = redisService.cacheWrapper(
  async function _getConversation(conversationId) {
    await dbConnect();
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return null;
    }
    
    return conversation.toObject();
  },
  {
    namespace: 'conversation',
    ttl: 300,
    keyGenerator: (args) => `conversation:${args[0]}`
  }
);

/**
 * Get all conversations for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (starting from 1)
 * @param {number} options.limit - Number of items per page
 * @returns {Promise<{conversations: Array, total: number, page: number, totalPages: number}>}
 */
export const getUserConversations = redisService.cacheWrapper(
  async function _getUserConversations(userId, options = {}) {
    await dbConnect();
    
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Conversation.countDocuments({ userId });
    
    // Get paginated conversations
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      conversations: conversations.map(conv => conv.toObject()),
      total,
      page,
      totalPages
    };
  },
  {
    namespace: 'userConversations',
    ttl: 300,
    keyGenerator: (args) => {
      const userId = args[0];
      const options = args[1] || {};
      const page = options.page || 1;
      const limit = options.limit || 10;
      return `userConversations:userId:${userId}:page:${page}:limit:${limit}`;
    }
  }
);

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export async function deleteConversation(conversationId) {
  await dbConnect();
  
  // Get conversation to find userId before deletion
  const conversation = await Conversation.findById(conversationId);
  const userId = conversation?.userId;
  
  const result = await Conversation.deleteOne({ _id: conversationId });
  
  // Invalidate conversation cache
  if (userId) {
    await invalidateConversationCache(conversationId, userId);
  }
  
  return result.deletedCount > 0;
}

/**
 * Update conversation title
 * @param {string} conversationId - The conversation ID
 * @param {string} title - The new title
 * @returns {Promise<Object|null>} - The updated conversation or null if not found
 */
export async function updateConversationTitle(conversationId, title) {
  await dbConnect();
  
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    return null;
  }
  
  conversation.title = title;
  conversation.updatedAt = new Date();
  await conversation.save();
  
  // Invalidate conversation cache
  await invalidateConversationCache(conversationId, conversation.userId);
  
  return conversation.toObject();
}

/**
 * Helper functions to invalidate caches
 */
async function invalidateConversationCache(conversationId, userId) {
  // Clear specific conversation cache
  try {
    // Try to delete specific key
    await redisService.del(`conversation:${conversationId}`);
    
    // Also invalidate user conversations lists
    if (userId) {
      await invalidateUserConversationsCache(userId);
    }
  } catch (error) {
    console.error(`Error invalidating conversation cache for ${conversationId}:`, error.message);
  }
}

async function invalidateUserConversationsCache(userId) {
  try {
    // This is a pattern, so we need a helper function
    const pattern = `userConversations:userId:${userId}*`;
    // Try to delete by pattern if supported, otherwise just log
    await redisService.del(`userConversations:userId:${userId}`);
    console.log(`Invalidated cache for user ${userId}`);
  } catch (error) {
    console.error(`Error invalidating user conversations cache for ${userId}:`, error.message);
  }
} 