// API Middleware to handle requests consistently
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { rateLimit } from 'express-rate-limit';

// Error handler to standardize API error responses
export const apiError = (res, status, message, details = null) => {
  return res.status(status).json({
    error: {
      status,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  });
};

// Success response formatter
export const apiSuccess = (res, data, status = 200) => {
  return res.status(status).json({
    data,
    timestamp: new Date().toISOString(),
  });
};

// Authenticate middleware
export const authenticate = async (req, res, next) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return apiError(res, 401, 'Unauthorized: Authentication required');
  }
  req.user = session.user;
  return next();
};

// Rate limit middleware creator
export const createRateLimiter = (
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100 // limit each IP to 100 requests per windowMs
) => {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true, 
    legacyHeaders: false,
    handler: (req, res) => {
      return apiError(res, 429, 'Too many requests, please try again later');
    },
  });
  
  return (req, res, next) => {
    return limiter(req, res, next);
  };
};

// API handler wrapper
export const withApiHandler = (handler, options = {}) => {
  const { 
    auth = false, 
    rateLimitMax = null,
    rateLimitWindow = 15 * 60 * 1000 
  } = options;
  
  return async (req, res) => {
    // Apply rate limiting if specified
    if (rateLimitMax) {
      const limiter = createRateLimiter(rateLimitWindow, rateLimitMax);
      await new Promise((resolve) => limiter(req, res, resolve));
    }
    
    // Apply authentication if required
    if (auth) {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return apiError(res, 401, 'Unauthorized: Authentication required');
      }
      req.user = session.user;
    }
    
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API error:', error);
      return apiError(
        res, 
        error.statusCode || 500, 
        error.message || 'Internal server error',
        process.env.NODE_ENV === 'development' ? error.stack : null
      );
    }
  };
}; 