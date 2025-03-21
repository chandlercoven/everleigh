/**
 * Simple in-memory database for storing conversations
 * This is a temporary solution until a proper database is integrated
 */

import dbConnect from './mongoose';
import Conversation from './models/conversation';

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
  
  return conversation.toObject();
}

/**
 * Get a conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} - The conversation or null if not found
 */
export async function getConversation(conversationId) {
  await dbConnect();
  
  const conversation = await Conversation.findById(conversationId);
  return conversation ? conversation.toObject() : null;
}

/**
 * Get all conversations for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of conversations
 */
export async function getUserConversations(userId) {
  await dbConnect();
  
  const conversations = await Conversation.find({ userId })
    .sort({ updatedAt: -1 });
  
  return conversations.map(conv => conv.toObject());
}

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export async function deleteConversation(conversationId) {
  await dbConnect();
  
  const result = await Conversation.deleteOne({ _id: conversationId });
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
  
  return conversation.toObject();
} 