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
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
conversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Define and export the model
export default mongoose.models.Conversation || 
  mongoose.model('Conversation', conversationSchema); 