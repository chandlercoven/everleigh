/**
 * API Key Validation Script for Everleigh
 * 
 * This script tests API keys to ensure they're valid.
 * It can be run during startup, by a healthcheck, or manually.
 * 
 * Usage:
 *   node scripts/validation/validate-api-keys.js [--exit-on-fail] [--silent]
 *   
 * Options:
 *   --exit-on-fail: Exit with code 1 if validation fails
 *   --silent: Only output on errors (useful for cron jobs)
 */

import { OpenAI } from 'openai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct location
// First try root .env.local (normal location)
// Then try the config/env directory (project-specific location)
const rootEnvPath = path.resolve(process.cwd(), '.env.local');
const configEnvPath = path.resolve(process.cwd(), 'config/env/.env.local');

if (fs.existsSync(rootEnvPath)) {
  console.log(`Loading environment from ${rootEnvPath}`);
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(configEnvPath)) {
  console.log(`Loading environment from ${configEnvPath}`);
  dotenv.config({ path: configEnvPath });
} else {
  console.log('No .env.local file found in root or config/env directory.');
  console.log('Will try to use environment variables from system environment.');
}

// Parse arguments
const args = process.argv.slice(2);
const EXIT_ON_FAIL = args.includes('--exit-on-fail');
const SILENT = args.includes('--silent');

// Configure log level
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
const LOG_FILE = process.env.LOG_FILE || path.join(__dirname, '../../logs/api-validation.log');

// Create log directory if logging to file
if (LOG_TO_FILE) {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// Simple logger
function log(level, message, data = {}) {
  if (SILENT && level !== 'error') return;
  
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  if (levels[level] > levels[LOG_LEVEL]) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Include data if available
  const fullMessage = Object.keys(data).length 
    ? `${logMessage} ${JSON.stringify(data)}`
    : logMessage;
  
  // Console output
  if (level === 'error') {
    console.error(fullMessage);
  } else if (level === 'warn') {
    console.warn(fullMessage);
  } else {
    console.log(fullMessage);
  }
  
  // File output if configured
  if (LOG_TO_FILE) {
    fs.appendFileSync(LOG_FILE, fullMessage + '\n');
  }
}

// Validate OpenAI API key
async function validateOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // Check if key exists
  if (!apiKey) {
    log('error', 'OpenAI API key is not set (OPENAI_API_KEY environment variable is missing)');
    return false;
  }
  
  // Check if key has a valid format
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    log('error', 'OpenAI API key has invalid format', { 
      hint: 'Key should start with "sk-" and be at least 20 characters' 
    });
    return false;
  }
  
  try {
    log('info', 'Testing OpenAI API key with a simple request...');
    
    // Initialize client
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Make minimal API call to verify key
    // Using models list as it's a lightweight call
    const startTime = Date.now();
    await openai.models.list();
    const duration = Date.now() - startTime;
    
    log('info', 'OpenAI API key is valid', { 
      duration: `${duration}ms`
    });
    
    return true;
  } catch (error) {
    // Handle different error types
    let detailedError = '';
    
    if (error.response) {
      // API error response
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        detailedError = 'Invalid API key or unauthorized';
      } else if (status === 403) {
        detailedError = 'API key does not have permission to access this resource';
      } else if (status === 429) {
        detailedError = 'Rate limit exceeded';
      } else {
        detailedError = `API returned error ${status}: ${data?.error?.message || 'Unknown error'}`;
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      detailedError = 'Network error: Could not connect to OpenAI API';
    } else {
      detailedError = error.message || 'Unknown error';
    }
    
    log('error', `OpenAI API key validation failed: ${detailedError}`, {
      errorCode: error.code || error.response?.status || 'unknown',
      errorType: error.type || 'unknown'
    });
    
    return false;
  }
}

// Validate LiveKit API keys if they exist
async function validateLiveKitKeys() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    log('warn', 'LiveKit API keys not set, skipping validation');
    return true; // Not critical, so return true
  }
  
  // Basic validation of key format
  if (apiKey.length < 8 || apiSecret.length < 16) {
    log('error', 'LiveKit API keys appear to be too short');
    return false;
  }
  
  // We don't do a live test here as that would require more dependencies
  // In a real implementation, you might want to make a simple API call
  log('info', 'LiveKit API keys appear to be properly formatted');
  return true;
}

// Add other API key validations as needed
// ...

// Main validation function
async function validateAllKeys() {
  log('info', 'Starting API key validation');
  
  // Log environment information
  log('info', 'Environment settings', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set (value hidden)' : 'not set',
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? 'set (value hidden)' : 'not set',
    REDIS_URL: process.env.REDIS_URL ? 'set' : 'not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set'
  });
  
  // Track overall status
  let allValid = true;
  
  // Validate OpenAI key
  const openaiValid = await validateOpenAIKey();
  allValid = allValid && openaiValid;
  
  // Validate LiveKit keys
  const livekitValid = await validateLiveKitKeys();
  allValid = allValid && livekitValid;
  
  // Add other validations here as needed
  // ...
  
  // Output summary
  if (allValid) {
    log('info', 'All API keys validated successfully');
  } else {
    log('error', 'Some API keys failed validation');
  }
  
  return allValid;
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateAllKeys().then(allValid => {
    if (!allValid && EXIT_ON_FAIL) {
      process.exit(1);
    }
  }).catch(error => {
    log('error', 'Unexpected error during validation', { error: error.message });
    if (EXIT_ON_FAIL) {
      process.exit(1);
    }
  });
}

// Export for use in other modules
export {
  validateOpenAIKey,
  validateLiveKitKeys,
  validateAllKeys
}; 