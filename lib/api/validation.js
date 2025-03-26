// API validation utilities
import { z } from 'zod';
import { apiError } from './middleware';

// Generic validator for API requests
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    // Select the appropriate data based on method
    const data = req.method === 'GET' ? req.query : req.body;
    const validated = schema.parse(data);
    
    // Attach validated data to request
    req.validated = validated;
    return next();
  } catch (error) {
    if (error.errors) {
      return apiError(res, 400, 'Validation error', error.errors);
    }
    return apiError(res, 400, error.message);
  }
};

// Common schemas
export const schemas = {
  // Authentication
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  
  // Conversation
  createConversation: z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['text', 'voice']),
  }),
  
  // Transcription
  transcription: z.object({
    audio: z.any(),
  }),
  
  // Voice processing
  textToSpeech: z.object({
    text: z.string().min(1, 'Text is required'),
    voice: z.string().optional(),
  }),
  
  // LiveKit tokens
  livekitToken: z.object({
    username: z.string().min(1, 'Username is required'),
    room: z.string().min(1, 'Room name is required'),
  }),
  
  // Workflow
  workflowTrigger: z.object({
    workflowId: z.string().uuid('Invalid workflow ID'),
    data: z.record(z.any()).optional(),
  }),
};

// Export wrapper for convenience
export const withValidation = (schema, handler) => {
  return async (req, res) => {
    try {
      const data = req.method === 'GET' ? req.query : req.body;
      req.validated = schema.parse(data);
      return handler(req, res);
    } catch (error) {
      if (error.errors) {
        return apiError(res, 400, 'Validation error', error.errors);
      }
      return apiError(res, 400, error.message);
    }
  };
}; 