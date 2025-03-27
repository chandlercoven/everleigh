/**
 * Redis-based caching utility for the application
 * Provides better performance, persistence, and distributed capabilities
 */
import { createClient } from 'redis';

// Check if Redis is explicitly disabled
const REDIS_DISABLED = process.env.DISABLE_REDIS === 'true';

// Create a Redis client with configuration from environment variables
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
let redisClient = null;
let redisConnected = false;

// Default TTL in seconds (5 minutes)
const DEFAULT_TTL = 300;

// Log current environment information
console.log('Redis Config:', {
  disabled: REDIS_DISABLED,
  url: redisUrl,
  nodeEnv: process.env.NODE_ENV,
  disableRedis: process.env.DISABLE_REDIS
});

// Initialize Redis connection
const initRedis = async () => {
  // Skip Redis initialization if disabled
  if (REDIS_DISABLED) {
    console.log('Redis is disabled by configuration. Skipping Redis initialization.');
    return false;
  }

  try {
    console.log(`Connecting to Redis at ${redisUrl}...`);
    
    // Create a Redis client with retry strategy and better debug information
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          console.log(`Redis reconnect attempt: ${retries}`);
          return Math.min(retries * 100, 3000); // Max 3 second delay between retries
        },
        connectTimeout: 5000, // 5 seconds
        keepAlive: 1000, // Enable keepalive
        noDelay: true // Disable Nagle's algorithm
      },
      // Add more options for debugging
      disableOfflineQueue: false,
      legacyMode: false
    });

    // Enhanced error logging
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      console.error('Redis error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      redisConnected = false;
    });
    
    redisClient.on('connect', () => {
      console.log('Redis connected successfully to', redisUrl);
      redisConnected = true;
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
    
    redisClient.on('end', () => {
      console.log('Redis connection closed');
      redisConnected = false;
    });

    // Try to connect
    await redisClient.connect();
    redisConnected = true;
    
    // Test Redis connection
    try {
      await redisClient.ping();
      console.log('Redis PING successful');
    } catch (pingError) {
      console.error('Redis PING failed:', pingError);
    }
    
    return true;
  } catch (err) {
    console.error('Redis connection error:', err);
    console.error('Redis connection error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    redisConnected = false;
    return false;
  }
};

// Initialize Redis on module load but don't block
if (!REDIS_DISABLED) {
  initRedis().catch(err => {
    console.error('Failed to initialize Redis:', err);
    console.error('Stack trace:', err.stack);
  });
}

/**
 * Get a value from the cache
 * @param {string} key - The cache key
 * @returns {Promise<any>} - The cached value or null if not found
 */
export async function get(key) {
  if (REDIS_DISABLED || !redisConnected || !redisClient) {
    return null;
  }
  
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error('Redis get error:', error);
    console.error('Redis get error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      key: key
    });
    return null;
  }
}

/**
 * Set a value in the cache
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} - True if successful
 */
export async function set(key, value, ttl = DEFAULT_TTL) {
  if (REDIS_DISABLED || !redisConnected || !redisClient) {
    return false;
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Remove a value from the cache
 * @param {string} key - The cache key
 * @returns {Promise<boolean>} - True if successful
 */
export async function del(key) {
  if (REDIS_DISABLED || !redisConnected || !redisClient) {
    return false;
  }
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis del error:', error);
    return false;
  }
}

/**
 * Clear the entire cache (use with caution!)
 * @returns {Promise<boolean>} - True if successful
 */
export async function flush() {
  if (REDIS_DISABLED || !redisConnected || !redisClient) {
    return false;
  }
  
  try {
    await redisClient.flushAll();
    return true;
  } catch (error) {
    console.error('Redis flushAll error:', error);
    return false;
  }
}

/**
 * Delete keys matching a pattern
 * @param {string} pattern - Pattern to match keys (e.g., "user:*")
 * @returns {Promise<number>} - Number of keys deleted
 */
export async function deleteByPattern(pattern) {
  if (REDIS_DISABLED || !redisConnected || !redisClient) {
    return 0;
  }
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    
    const pipeline = redisClient.multi();
    keys.forEach(key => pipeline.del(key));
    await pipeline.exec();
    
    return keys.length;
  } catch (error) {
    console.error('Redis deleteByPattern error:', error);
    return 0;
  }
}

/**
 * Generate a cache key with a namespace
 * @param {string} namespace - The namespace for the key
 * @param {Object} params - Parameters to include in the key
 * @returns {string} - The cache key
 */
export function generateCacheKey(namespace, params = {}) {
  const keyParts = [namespace];
  
  // Sort the parameters to ensure consistent keys
  const sortedKeys = Object.keys(params).sort();
  
  for (const key of sortedKeys) {
    if (params[key] !== undefined && params[key] !== null) {
      keyParts.push(`${key}:${params[key]}`);
    }
  }
  
  return keyParts.join(':');
}

/**
 * Higher-order function to cache the result of an async function
 * @param {Function} fn - The function to cache
 * @param {Object} options - Cache options
 * @param {string} options.namespace - The namespace for the cache key
 * @param {number} options.ttl - Time to live in seconds
 * @param {Function} options.keyGenerator - Function to generate the cache key
 * @returns {Function} - Cached function
 */
export function cacheWrapper(fn, options = {}) {
  const { 
    namespace = fn.name || 'default', 
    ttl = DEFAULT_TTL,
    keyGenerator = (args) => generateCacheKey(namespace, args[0] || {})
  } = options;
  
  return async function(...args) {
    // If Redis is disabled, just call the original function
    if (REDIS_DISABLED) {
      return await fn(...args);
    }
    
    if (!redisConnected || !redisClient) {
      // Skip caching if Redis is not available
      return await fn(...args);
    }
    
    try {
      const cacheKey = keyGenerator(args);
      const cachedResult = await get(cacheKey);
      
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      const result = await fn(...args);
      await set(cacheKey, result, ttl);
      
      return result;
    } catch (error) {
      console.error('Cache wrapper error:', error);
      // If caching fails, still return the original function result
      return await fn(...args);
    }
  };
}

// Export default redisClient for advanced usage
export default {
  client: redisClient,
  isConnected: () => redisConnected,
  isDisabled: REDIS_DISABLED
}; 