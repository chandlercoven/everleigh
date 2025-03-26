import { set, get } from '../../lib/redis-cache';

export default async function handler(req, res) {
  // Set a value in Redis cache
  const testKey = 'test-modernization';
  const testValue = {
    message: 'Hello from modernized API!',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Store the value in Redis
    await set(testKey, testValue);
    
    // Retrieve the value from Redis
    const retrievedValue = await get(testKey);
    
    // Return success response
    res.status(200).json({
      success: true,
      stored: testValue,
      retrieved: retrievedValue,
      match: JSON.stringify(testValue) === JSON.stringify(retrievedValue)
    });
  } catch (error) {
    console.error('Error in test-modernization API:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 