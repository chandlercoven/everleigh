/**
 * Redis service for caching with fallback to in-memory
 * All function names are explicit to avoid minification issues
 */

const Redis = require('ioredis');
const NodeCache = require('node-cache');

// In-memory fallback cache 
const memoryCache = new NodeCache({ 
  stdTTL: 60, // Default TTL of 60s
  checkperiod: 120 // Cleanup every 2 minutes
});

// Connection state
let redisClient = null;
let connectionFailed = false;

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true';

/**
 * Get the Redis client instance, creating if needed
 */
async function getRedisClient() {
  // Use memory cache if Redis is disabled
  if (DISABLE_REDIS || connectionFailed) {
    return null;
  }

  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }

  try {
    console.log(`Connecting to Redis at ${REDIS_URL}`);
    
    // Create a new Redis client with timeout
    const client = new Redis(REDIS_URL, {
      connectTimeout: 5000,
      commandTimeout: 3000,
      retryStrategy: function redisRetryStrategy(times) {
        if (times > 3) {
          console.warn('Redis connection failed after multiple retries');
          connectionFailed = true;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Increasing delay
      }
    });

    // Setup event handlers
    client.on('error', function redisErrorHandler(err) {
      console.error('Redis Error:', err.message);
      if (!connectionFailed) {
        connectionFailed = true;
        redisClient = null;
      }
    });

    client.on('connect', function redisConnectHandler() {
      console.log('Redis connected successfully');
      connectionFailed = false;
    });

    // Test connection
    await client.ping();
    
    redisClient = client;
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    connectionFailed = true;
    return null;
  }
}

/**
 * Set a value in the cache with TTL
 */
async function setCache(key, value, ttlSeconds = 60) {
  if (!key) return false;
  
  try {
    // Stringify objects
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    
    // Try Redis first
    const client = await getRedisClient();
    if (client) {
      await client.set(key, serializedValue, 'EX', ttlSeconds);
      return true;
    }
    
    // Fallback to memory cache
    return memoryCache.set(key, value, ttlSeconds);
  } catch (error) {
    console.error('Cache set error:', error.message);
    // Fallback to memory cache on error
    return memoryCache.set(key, value, ttlSeconds);
  }
}

/**
 * Get a value from the cache
 */
async function getCache(key) {
  if (!key) return null;
  
  try {
    // Try Redis first
    const client = await getRedisClient();
    if (client) {
      const value = await client.get(key);
      if (!value) return null;
      
      // Parse JSON if possible
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    // Fallback to memory cache
    return memoryCache.get(key);
  } catch (error) {
    console.error('Cache get error:', error.message);
    // Fallback to memory cache on error
    return memoryCache.get(key);
  }
}

/**
 * Delete a value from the cache
 */
async function deleteCache(key) {
  if (!key) return false;
  
  try {
    // Try Redis first
    const client = await getRedisClient();
    if (client) {
      await client.del(key);
    }
    
    // Also delete from memory cache
    memoryCache.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error.message);
    // Try memory cache anyway
    memoryCache.del(key);
    return false;
  }
}

/**
 * Wrap a function with caching
 */
function cacheWrapper(fn, options = {}) {
  const namespace = options.namespace || 'cache';
  const ttl = options.ttl || 60;
  
  return async function cachedFunction(...args) {
    const key = `${namespace}:${JSON.stringify(args)}`;
    
    // Check cache first
    const cached = await getCache(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    
    // Execute original function
    const result = await fn(...args);
    
    // Cache the result
    await setCache(key, result, ttl);
    
    return result;
  };
}

// Export with explicit names
module.exports = {
  getClient: getRedisClient,
  set: setCache,
  get: getCache,
  del: deleteCache,
  cacheWrapper: cacheWrapper
}; 