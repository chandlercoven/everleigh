/**
 * Caching utility for the application
 */
import NodeCache from 'node-cache';

// Create a cache instance with a default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes in seconds
  checkperiod: 60, // Check for expired keys every minute
});

/**
 * Get a value from the cache
 * @param {string} key - The cache key
 * @returns {*} - The cached value or undefined if not found
 */
export function get(key) {
  return cache.get(key);
}

/**
 * Set a value in the cache
 * @param {string} key - The cache key
 * @param {*} value - The value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} - True if successful
 */
export function set(key, value, ttl = undefined) {
  return cache.set(key, value, ttl);
}

/**
 * Remove a value from the cache
 * @param {string} key - The cache key
 * @returns {number} - Number of removed keys (0 or 1)
 */
export function del(key) {
  return cache.del(key);
}

/**
 * Clear the entire cache
 * @returns {void}
 */
export function flush() {
  return cache.flushAll();
}

/**
 * Get stats about the cache
 * @returns {Object} - Cache statistics
 */
export function getStats() {
  return cache.getStats();
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
    ttl = undefined,
    keyGenerator = (args) => generateCacheKey(namespace, args[0] || {})
  } = options;
  
  return async function(...args) {
    const cacheKey = keyGenerator(args);
    const cachedResult = get(cacheKey);
    
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    const result = await fn(...args);
    set(cacheKey, result, ttl);
    
    return result;
  };
}

// Export default cache instance
export default cache; 