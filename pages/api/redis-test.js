/**
 * API endpoint to test Redis connectivity and configuration
 * This endpoint is useful for diagnosing Redis-related issues
 */

// Fix to use CommonJS require format
const redisService = require('../../lib/redis-service');

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test configuration
    const config = {
      environment: {
        redisUrl: process.env.REDIS_URL || 'Not set',
        disableRedis: process.env.DISABLE_REDIS === 'true',
        nodeEnv: process.env.NODE_ENV,
      }
    };

    // Get Redis client
    const client = await redisService.getClient();
    
    // Perform basic Redis tests
    const tests = {
      connection: {
        success: !!client,
        message: client ? 'Redis client created successfully' : 'Failed to create Redis client'
      }
    };

    // Only perform additional tests if we have a client
    if (client) {
      try {
        // Test ping
        const pingResult = await client.ping();
        tests.ping = {
          success: pingResult === 'PONG',
          message: `Redis ping result: ${pingResult}`
        };
      } catch (pingError) {
        tests.ping = {
          success: false,
          message: `Redis ping error: ${pingError.message}`
        };
      }

      try {
        // Test set/get
        const testKey = 'redis-test-key';
        const testValue = { test: true, timestamp: new Date().toISOString() };
        
        // Use the service methods to test the full functionality
        await redisService.set(testKey, testValue, 60);
        const retrievedValue = await redisService.get(testKey);
        
        tests.setGet = {
          success: retrievedValue && retrievedValue.test === true,
          message: retrievedValue 
            ? 'Successfully set and retrieved test value' 
            : 'Failed to set or retrieve test value'
        };
        
        // Clean up
        await redisService.del(testKey);
      } catch (cacheError) {
        tests.setGet = {
          success: false,
          message: `Cache test error: ${cacheError.message}`
        };
      }
    }

    // Return all test results and configuration
    return res.status(200).json({
      success: true,
      data: {
        environment: config.environment,
        tests,
        message: 'Redis diagnostics complete'
      }
    });
  } catch (error) {
    console.error('Redis test error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Redis test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 