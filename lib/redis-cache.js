/**
 * Redis-based caching utility for the application
 * Provides better performance, persistence, and distributed capabilities
 */
import { createClient } from 'redis';

// Create a Redis client with configuration from environment variables
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

// Default TTL in seconds (5 minutes)
const DEFAULT_TTL = 300;

// Connect to Redis when the module is loaded
redisClient.connect().catch(err => {
  console.error('Redis connection error:', err);
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

/**
 * Get a value from the cache
 * @param {string} key - The cache key
 * @returns {Promise<any>} - The cached value or null if not found
 */
export async function get(key) {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error('Redis get error:', error);
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
    const cacheKey = keyGenerator(args);
    const cachedResult = await get(cacheKey);
    
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    const result = await fn(...args);
    await set(cacheKey, result, ttl);
    
    return result;
  };
}

// Export default redisClient for advanced usage
export default redisClient; 