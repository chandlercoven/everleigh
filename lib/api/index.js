// API utilities index
export * from './middleware';
export * from './validation';
export * from './db';
export * from './cache';
export * from './logger';
export * from './handlers';

// Re-export common utilities for convenience
import { apiError, apiSuccess, withApiHandler } from './middleware';
import { validateRequest, withValidation, schemas } from './validation';
import { getDatabase, getCollection, getMongooseConnection } from './db';
import { getCachedValue, setCachedValue, withCache } from './cache';
import { logger, requestLogger, errorLogger } from './logger';
import { createApiHandler } from './handlers';

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