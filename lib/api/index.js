// API utilities index
export * from './middleware';
export * from './validation';
export * from './db';
export * from './cache';
export * from './logger';

// Re-export common utilities for convenience
import { apiError, apiSuccess, withApiHandler } from './middleware';
import { validateRequest, withValidation, schemas } from './validation';
import { getDatabase, getCollection, getMongooseConnection } from './db';
import { getCachedValue, setCachedValue, withCache } from './cache';
import { logger, requestLogger, errorLogger } from './logger';

// Simple API handler creator with common patterns
export const createApiHandler = ({
  methods = ['GET'],
  validator = null,
  requireAuth = false,
  rateLimit = null,
  enableCache = false,
  cacheTtl = 600,
  handler = async () => ({}),
}) => {
  // Create wrapped handler with appropriate middleware
  return withApiHandler(
    async (req, res) => {
      // Check HTTP method
      if (!methods.includes(req.method)) {
        return apiError(res, 405, `Method ${req.method} Not Allowed`);
      }
      
      // Apply validator if provided
      if (validator) {
        try {
          const data = req.method === 'GET' ? req.query : req.body;
          req.validated = validator.parse(data);
        } catch (error) {
          return apiError(
            res, 
            400, 
            'Validation error', 
            error.errors || error.message
          );
        }
      }
      
      // Use caching if enabled
      if (enableCache && req.method === 'GET') {
        const cacheKey = `api:${req.url}`;
        const cachedResponse = await getCachedValue(cacheKey);
        
        if (cachedResponse) {
          return res.status(200).json({
            ...cachedResponse,
            cached: true,
          });
        }
        
        // Execute handler
        const result = await handler(req, res);
        
        // Cache the result if not already returned by handler
        if (!res.headersSent && result) {
          await setCachedValue(cacheKey, result, cacheTtl);
          return apiSuccess(res, result);
        }
        
        return result;
      }
      
      // Normal execution without caching
      return await handler(req, res);
    },
    {
      auth: requireAuth,
      rateLimitMax: rateLimit,
    }
  );
};

// Export everything for convenience
export const api = {
  error: apiError,
  success: apiSuccess,
  handler: withApiHandler,
  createHandler: createApiHandler,
  validate: validateRequest,
  withValidation,
  schemas,
  db: {
    getDatabase,
    getCollection,
    getMongoose: getMongooseConnection,
  },
  cache: {
    get: getCachedValue,
    set: setCachedValue,
    withCache,
  },
  logger,
  middleware: {
    requestLogger,
    errorLogger,
  },
}; 