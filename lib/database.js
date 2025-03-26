/**
 * Database service for storing conversations
 * Uses MongoDB with Redis caching for improved performance
 */

import dbConnect from './mongoose';
import Conversation from './models/conversation';
import { cacheWrapper, deleteByPattern, generateCacheKey } from './redis-cache';

/**
 * Create a new conversation
 * @param {string} userId - The user ID
 * @param {string} title - Optional title for the conversation
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
 * @param {string} role - The role ('user' or 'assistant')
 * @param {string} content - The message content
 * @returns {Promise<Object>} - The updated conversation
 */
export async function addMessage(conversationId, role, content) {
  await dbConnect();
  
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
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
export const getConversation = cacheWrapper(
  async function getConversationImpl(conversationId) {
    await dbConnect();
    
    const conversation = await Conversation.findById(conversationId);
    return conversation ? conversation.toObject() : null;
  },
  {
    namespace: 'conversation',
    ttl: 60 * 5, // 5 minutes
    keyGenerator: args => `conversation:${args[0]}`
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
export const getUserConversations = cacheWrapper(
  async function getUserConversationsImpl(userId, options = {}) {
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
    ttl: 60 * 1, // 1 minute
    keyGenerator: args => generateCacheKey('userConversations', {
      userId: args[0],
      page: args[1]?.page || 1,
      limit: args[1]?.limit || 10
    })
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
  await deleteByPattern(`conversation:${conversationId}`);
  
  // Also invalidate user conversations lists
  if (userId) {
    await invalidateUserConversationsCache(userId);
  }
}

async function invalidateUserConversationsCache(userId) {
  // Delete all user conversation caches for this user
  await deleteByPattern(`userConversations:userId:${userId}*`);
} 