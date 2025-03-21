import mongoose from 'mongoose';

// Define the message schema
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the conversation schema
const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add compound index for common query patterns
conversationSchema.index({ userId: 1, updatedAt: -1 });

// Add text index for search functionality
conversationSchema.index({ title: 'text', 'messages.content': 'text' });

// Update the updatedAt timestamp before saving
conversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Define and export the model
export default mongoose.models.Conversation || 
  mongoose.model('Conversation', conversationSchema); 