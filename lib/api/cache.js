// Cache utility functions for Redis
import Redis from 'ioredis';
import NodeCache from 'node-cache';

// Fallback to in-memory cache if Redis is not available
let localCache = null;
let redisClient = null;

// Initialize the cache system
export const initCache = async () => {
  if (redisClient || localCache) {
    return;
  }

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      redisClient = new Redis(redisUrl);
      // Test the connection
      await redisClient.ping();
      console.log('Redis connection established');
      
      // Handle Redis errors
      redisClient.on('error', (err) => {
        console.error('Redis error:', err);
        // Fall back to local cache if Redis fails
        if (!localCache) {
          console.log('Falling back to in-memory cache');
          localCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
        }
      });
      
      return redisClient;
    } catch (error) {
      console.error('Redis connection error:', error);
      console.log('Falling back to in-memory cache');
    }
  }
  
  // Fallback to in-memory cache
  localCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  console.log('Using in-memory cache (NodeCache)');
  return localCache;
};

// Get a value from cache
export const getCachedValue = async (key) => {
  await initCache();
  
  try {
    if (redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } else if (localCache) {
      return localCache.get(key) || null;
    }
  } catch (error) {
    console.error(`Error getting cached value for key '${key}':`, error);
    return null;
  }
  
  return null;
};

// Set a value in cache
export const setCachedValue = async (key, value, ttlSeconds = 600) => {
  await initCache();
  
  try {
    if (redisClient) {
      await redisClient.set(
        key,
        JSON.stringify(value),
        'EX',
        ttlSeconds
      );
      return true;
    } else if (localCache) {
      return localCache.set(key, value, ttlSeconds);
    }
  } catch (error) {
    console.error(`Error setting cached value for key '${key}':`, error);
    return false;
  }
  
  return false;
};

// Delete a value from cache
export const deleteCachedValue = async (key) => {
  await initCache();
  
  try {
    if (redisClient) {
      await redisClient.del(key);
      return true;
    } else if (localCache) {
      return localCache.del(key);
    }
  } catch (error) {
    console.error(`Error deleting cached value for key '${key}':`, error);
    return false;
  }
  
  return false;
};

// Clear entire cache (use with caution!)
export const clearCache = async () => {
  await initCache();
  
  try {
    if (redisClient) {
      await redisClient.flushdb();
      return true;
    } else if (localCache) {
      localCache.flushAll();
      return true;
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
  
  return false;
};

// Cache decorator for functions
export const withCache = (fn, keyPrefix, ttlSeconds = 600) => {
  return async (...args) => {
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    
    // Try to get from cache first
    const cachedResult = await getCachedValue(key);
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    // If not in cache, execute the function
    const result = await fn(...args);
    
    // Cache the result
    await setCachedValue(key, result, ttlSeconds);
    
    return result;
  };
}; 