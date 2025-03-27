/**
 * Test script to identify Redis connection issues
 * 
 * This script tests Redis connections in multiple ways to isolate the error:
 * 1. Direct connection using 'redis' library
 * 2. Direct connection using 'ioredis' library
 * 3. Testing connection with different configurations
 * 4. Testing the importability of connection modules in a way that simulates Next.js bundling
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Try different Redis client libraries
const redis = require('redis');
const Redis = require('ioredis');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Configuration variables
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true';
const TEST_KEY = 'redis-test-' + Date.now();
const TEST_VALUE = { message: 'Redis connection test', timestamp: Date.now() };

// Log environment information
console.log('=== Environment Information ===');
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('DISABLE_REDIS:', process.env.DISABLE_REDIS);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('==============================');

// Helper function to run a function with timeout
async function withTimeout(fn, ms = 5000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    )
  ]);
}

// Test redis library connection
async function testRedisConnection() {
  console.log('\n=== Testing node-redis connection ===');
  console.log('Connecting to:', REDIS_URL);
  
  try {
    const client = redis.createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          console.log(`Reconnect attempt: ${retries}`);
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    // Event listeners
    client.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    client.on('connect', () => {
      console.log('Redis connected');
    });
    
    client.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
    
    // Connect to Redis
    await withTimeout(async () => {
      await client.connect();
      console.log('Successfully connected!');
      
      // Test set/get
      await client.set(TEST_KEY, JSON.stringify(TEST_VALUE));
      console.log('Successfully set test value');
      
      const value = await client.get(TEST_KEY);
      console.log('Retrieved value:', JSON.parse(value));
      
      // Cleanup
      await client.del(TEST_KEY);
      await client.quit();
      console.log('Connection closed');
    });
    
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
}

// Test ioredis library connection
async function testIoRedisConnection() {
  console.log('\n=== Testing ioredis connection ===');
  console.log('Connecting to:', REDIS_URL);
  
  try {
    const client = new Redis(REDIS_URL, {
      connectTimeout: 5000,
      retryStrategy: (times) => {
        console.log(`Retry attempt: ${times}`);
        return Math.min(times * 100, 3000);
      }
    });
    
    // Event handlers
    client.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    client.on('connect', () => {
      console.log('Redis connected');
    });
    
    // Test operations with timeout
    await withTimeout(async () => {
      // Test ping
      const pingResult = await client.ping();
      console.log('Ping result:', pingResult);
      
      // Test set/get
      await client.set(TEST_KEY + '-io', JSON.stringify(TEST_VALUE));
      console.log('Successfully set test value');
      
      const value = await client.get(TEST_KEY + '-io');
      console.log('Retrieved value:', JSON.parse(value));
      
      // Cleanup
      await client.del(TEST_KEY + '-io');
      await client.quit();
      console.log('Connection closed');
    });
    
    return true;
  } catch (error) {
    console.error('IoRedis connection failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
}

// Test importing the redis-cache module to see if it loads correctly
async function testRedisModuleImport() {
  console.log('\n=== Testing redis-cache module import ===');
  
  try {
    // First try dynamic import (like Next.js would do)
    const redisCache = await import('../lib/redis-cache.js');
    console.log('Successfully imported redis-cache module via ESM import');
    
    // Check exported functions
    console.log('Exported functions:', Object.keys(redisCache));
    
    return true;
  } catch (error) {
    console.error('Failed to import redis-cache module:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
}

// Test network connectivity to Redis server
async function testNetworkConnectivity() {
  console.log('\n=== Testing network connectivity to Redis ===');
  
  try {
    const { execSync } = require('child_process');
    
    // Parse Redis URL to get host and port
    const url = new URL(REDIS_URL);
    const host = url.hostname;
    const port = url.port || 6379;
    
    console.log(`Testing connectivity to ${host}:${port}`);
    
    // Test via telnet
    try {
      execSync(`nc -zv ${host} ${port} 2>&1`);
      console.log(`✅ Successfully connected to ${host}:${port}`);
    } catch (error) {
      console.error(`❌ Failed to connect to ${host}:${port}:`, error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Network connectivity test failed:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting Redis connection tests...');
  
  if (DISABLE_REDIS) {
    console.log('⚠️ DISABLE_REDIS is set to true. Tests will still run but Redis should be bypassed in the app.');
  }
  
  // Test basic network connectivity first
  const networkOk = await testNetworkConnectivity();
  if (!networkOk) {
    console.error('❌ Network connectivity test failed. Redis server may not be reachable.');
  }
  
  // Test direct Redis connections
  const redisResult = await testRedisConnection();
  const ioredisResult = await testIoRedisConnection();
  
  // Test module imports
  const moduleResult = await testRedisModuleImport();
  
  // Print summary
  console.log('\n=== Test Results Summary ===');
  console.log('Network connectivity:', networkOk ? '✅ PASSED' : '❌ FAILED');
  console.log('redis library connection:', redisResult ? '✅ PASSED' : '❌ FAILED');
  console.log('ioredis library connection:', ioredisResult ? '✅ PASSED' : '❌ FAILED');
  console.log('Module imports:', moduleResult ? '✅ PASSED' : '❌ FAILED');
  
  if (!networkOk || !redisResult || !ioredisResult || !moduleResult) {
    console.log('\n⚠️ Some tests failed. This may indicate issues with Redis connectivity.');
    
    if (!networkOk) {
      console.log('- Check that Redis is running and accessible from this machine');
      console.log('- Verify firewall settings and network configuration');
    }
    
    if (!redisResult || !ioredisResult) {
      console.log('- Check Redis URL configuration in .env.local');
      console.log('- Verify Redis server health and authentication settings');
    }
    
    if (!moduleResult) {
      console.log('- Check for import/export issues in the Redis module');
      console.log('- Verify compatibility with ESM and CommonJS imports');
    }
  } else {
    console.log('\n✅ All tests passed. Redis is properly configured and accessible.');
    console.log('If you are still experiencing issues in the application, they may be related to:');
    console.log('1. Next.js build optimization issues with async code');
    console.log('2. Runtime environment differences');
    console.log('3. Error handling in the application layer');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
}); 