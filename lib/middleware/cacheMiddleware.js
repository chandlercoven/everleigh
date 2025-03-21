/**
 * Cache middleware for API endpoints
 */
import { generateCacheKey, get, set } from '../cache';

/**
 * Create a cache middleware
 * @param {Object} options - Middleware options
 * @param {number} options.ttl - Time to live in seconds
 * @param {string} options.namespace - Cache namespace
 * @param {Function} options.keyGenerator - Function to generate the cache key
 * @returns {Function} - Express middleware
 */
export function createCacheMiddleware(options = {}) {
  const {
    ttl = 300, // Default 5 minutes
    namespace = 'api',
    keyGenerator = null,
  } = options;
  
  return (handler) => async (req, res) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }
    
    // Generate the cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : generateCacheKey(namespace, {
          path: req.url,
          query: JSON.stringify(req.query),
          user: req.user?.id || 'anonymous'
        });
    
    // Try to get from cache
    const cachedResponse = get(cacheKey);
    
    if (cachedResponse) {
      // Return the cached response
      return res.status(200).json({
        ...cachedResponse,
        _cached: true
      });
    }
    
    // Create a custom res.json to intercept the response
    const originalJson = res.json;
    res.json = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(cacheKey, body, ttl);
      }
      
      // Call the original json method
      return originalJson.call(this, body);
    };
    
    // Pass to the handler
    return handler(req, res);
  };
}

/**
 * Predefined cache middleware for different durations
 */
export const cacheMiddleware = {
  // Cache for 1 minute
  short: createCacheMiddleware({ ttl: 60, namespace: 'api:short' }),
  
  // Cache for 5 minutes (default)
  standard: createCacheMiddleware({ namespace: 'api:standard' }),
  
  // Cache for 15 minutes
  medium: createCacheMiddleware({ ttl: 15 * 60, namespace: 'api:medium' }),
  
  // Cache for 1 hour
  long: createCacheMiddleware({ ttl: 60 * 60, namespace: 'api:long' }),
  
  // Create a custom cache middleware
  custom: createCacheMiddleware
}; 