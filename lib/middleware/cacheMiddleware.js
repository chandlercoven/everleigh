/**
 * Cache middleware for API endpoints
 */
import redisService from '../redis-service';

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
    bypassHeader = 'x-bypass-cache',
    debug = false
  } = options;
  
  const middlewareName = `cacheMiddleware:${namespace}`;
  
  // Return named function to avoid minification issues in production
  return function cacheMiddlewareHandler(handler) {
    return async function cacheMiddlewareWrapper(req, res) {
      // Track timing for performance monitoring
      const startTime = Date.now();
      
      // Helper to log debugging info
      const logDebug = (message, data) => {
        if (debug) {
          console.log(`[${middlewareName}] ${message}`, data);
        }
      };
      
      try {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
          logDebug('Skipping cache for non-GET request', { method: req.method });
          return handler(req, res);
        }
        
        // Allow bypass with header
        if (req.headers && req.headers[bypassHeader]) {
          logDebug('Cache bypass requested via header');
          return handler(req, res);
        }
        
        // Check if Redis is disabled globally
        if (redisService.isRedisDisabled) {
          logDebug('Redis is disabled globally, skipping cache');
          return handler(req, res);
        }
        
        // Generate the cache key
        const cacheKey = keyGenerator 
          ? keyGenerator(req) 
          : redisService.generateCacheKey(namespace, {
              path: req.url,
              query: JSON.stringify(req.query),
              user: req.user?.id || 'anonymous'
            });
        
        logDebug('Generated cache key', { key: cacheKey });
        
        // Try to get from cache
        try {
          const cachedResponse = await redisService.get(cacheKey);
          
          if (cachedResponse) {
            logDebug('Cache hit', { 
              key: cacheKey,
              responseTime: Date.now() - startTime
            });
            
            // Return the cached response
            return res.status(200).json({
              ...cachedResponse,
              _cached: true,
              _cacheSource: 'redis',
              _cacheTime: new Date().toISOString()
            });
          }
          
          logDebug('Cache miss', { key: cacheKey });
        } catch (cacheError) {
          // Log error but continue without caching
          console.error(`[${middlewareName}] Cache get error:`, cacheError.message);
          logDebug('Cache error details', { 
            error: cacheError.message,
            stack: cacheError.stack
          });
        }
        
        // Create a custom res.json to intercept the response
        const originalJson = res.json;
        res.json = async function cachingJsonMethod(body) {
          try {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logDebug('Caching response', { 
                key: cacheKey,
                status: res.statusCode,
                ttl 
              });
              
              await redisService.set(cacheKey, body, ttl);
            }
          } catch (cacheError) {
            // Log error but continue without caching
            console.error(`[${middlewareName}] Cache set error:`, cacheError.message);
          }
          
          // Call the original json method
          return originalJson.call(this, body);
        };
        
        // Pass to the handler
        return handler(req, res);
      } catch (error) {
        console.error(`[${middlewareName}] Middleware error:`, error.message);
        console.error('Stack trace:', error.stack);
        
        // In case of error, bypass cache and call the handler directly
        return handler(req, res);
      }
    };
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