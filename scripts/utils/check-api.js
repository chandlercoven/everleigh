/**
 * API Health Check Script for Everleigh
 * 
 * This script tests the API and Redis functionality in production.
 * It makes requests to the API endpoints and logs information about
 * caching behavior and performance.
 * 
 * Usage:
 *   node scripts/check-api.js
 */

const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3002';
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Optional: get from environment
const API_ENDPOINTS = [
  '/api/ping',
  '/api/redis-test',
  '/api/conversations?page=1&limit=10'
];

// Test each endpoint with caching
async function testEndpoint(url, options = {}) {
  const startTime = performance.now();
  
  try {
    // First request - should not be cached
    console.log(`Testing endpoint: ${url}`);
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
        ...options.headers
      }
    });
    
    const data = await response.json();
    const firstRequestTime = performance.now() - startTime;
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Time: ${firstRequestTime.toFixed(2)}ms`);
    console.log(`  Cached: ${data._cached ? 'Yes' : 'No'}`);
    
    if (!response.ok) {
      console.error(`  Error: ${data.error || 'Unknown error'}`);
      if (data.details) {
        console.error(`  Details: ${data.details}`);
      }
      return {
        success: false,
        error: data.error,
        time: firstRequestTime
      };
    }
    
    // Second request - should be cached if Redis is working
    console.log(`  Making second request to test caching...`);
    const cacheStart = performance.now();
    const cachedResponse = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
        ...options.headers
      }
    });
    
    const cachedData = await cachedResponse.json();
    const secondRequestTime = performance.now() - cacheStart;
    
    console.log(`  Second request status: ${cachedResponse.status}`);
    console.log(`  Second request time: ${secondRequestTime.toFixed(2)}ms`);
    console.log(`  Second request cached: ${cachedData._cached ? 'Yes' : 'No'}`);
    
    // Calculate cache improvement
    if (cachedData._cached) {
      const improvement = (firstRequestTime - secondRequestTime) / firstRequestTime * 100;
      console.log(`  Cache performance improvement: ${improvement.toFixed(2)}%`);
    }
    
    return {
      success: true,
      firstTime: firstRequestTime,
      secondTime: secondRequestTime,
      cached: cachedData._cached,
      data: cachedData
    };
  } catch (error) {
    console.error(`  Error testing ${url}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test bypassing the cache
async function testCacheBypass(url) {
  console.log(`Testing cache bypass for: ${url}`);
  
  try {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-cache': 'true',
        ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {})
      }
    });
    
    const data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Cached: ${data._cached ? 'Yes' : 'No'}`);
    
    return {
      success: response.ok,
      cached: !!data._cached
    };
  } catch (error) {
    console.error(`  Error testing cache bypass:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=== Everleigh API Health Check ===');
  console.log(`Testing API at: ${API_URL}`);
  console.log('Authentication:', AUTH_TOKEN ? 'Provided' : 'None');
  console.log('');
  
  const results = {};
  
  // Test each endpoint
  for (const endpoint of API_ENDPOINTS) {
    results[endpoint] = await testEndpoint(endpoint);
    console.log(''); // Add spacing between tests
  }
  
  // Test cache bypass on first endpoint
  const bypassResult = await testCacheBypass(API_ENDPOINTS[0]);
  results['bypass'] = bypassResult;
  
  // Summary
  console.log('\n=== Summary ===');
  let allSuccessful = true;
  
  for (const [endpoint, result] of Object.entries(results)) {
    if (endpoint === 'bypass') continue;
    
    console.log(`${endpoint}: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.success) {
      console.log(`  Cache working: ${result.cached ? '✅ Yes' : '❌ No'}`);
    }
    
    if (!result.success) {
      allSuccessful = false;
    }
  }
  
  console.log(`Cache bypass: ${results.bypass.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`  Bypassed correctly: ${!results.bypass.cached ? '✅ Yes' : '❌ No'}`);
  
  console.log('\nOverall health:', allSuccessful ? '✅ Healthy' : '❌ Issues detected');
  
  // Redis-specific info
  if (results['/api/redis-test']?.success) {
    const redisData = results['/api/redis-test'].data;
    console.log('\n=== Redis Information ===');
    console.log('Redis URL:', redisData.data.environment.redisUrl);
    console.log('Redis disabled:', redisData.data.environment.disableRedis);
    
    // Print test results
    if (redisData.data.tests) {
      for (const [test, result] of Object.entries(redisData.data.tests)) {
        console.log(`${test}: ${result.success ? '✅ Success' : '❌ Failed'}`);
      }
    }
  }
  
  return allSuccessful;
}

// Run the tests
runTests()
  .then(success => {
    console.log('\nChecks completed.');
    // Exit with proper code for CI/CD pipelines
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  }); 