/**
 * Cache clearing utility for Everleigh
 * 
 * This script is used to clear caches in both Redis and filesystem
 * Run with: 
 *   - npm run cache:clear (clears all caches)
 *   - npm run cache:clear redis (clears only Redis cache)
 *   - npm run cache:clear local (clears only filesystem cache)
 */

import { clearCache } from '../lib/api/cache.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup proper dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CACHE_DIRS = [
  path.join(ROOT_DIR, '.next/cache'),
  path.join(ROOT_DIR, 'public/audio/generated'),
  path.join(ROOT_DIR, 'public/audio/response'),
];

async function clearLocalCache() {
  console.log('Clearing local filesystem caches...');
  
  for (const dir of CACHE_DIRS) {
    try {
      await fs.stat(dir);
      
      // Read directory contents
      const files = await fs.readdir(dir);
      
      // Remove each file (except .gitkeep)
      for (const file of files) {
        if (file !== '.gitkeep') {
          const filePath = path.join(dir, file);
          await fs.unlink(filePath);
          console.log(`Deleted: ${filePath}`);
        }
      }
      
      console.log(`Cleared directory: ${dir}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Directory does not exist: ${dir}`);
      } else {
        console.error(`Error clearing directory ${dir}:`, error);
      }
    }
  }
  
  console.log('Local filesystem caches cleared successfully');
}

async function clearRedisCache() {
  console.log('Clearing Redis cache...');
  
  try {
    const result = await clearCache();
    if (result) {
      console.log('Redis cache cleared successfully');
    } else {
      console.log('Failed to clear Redis cache - it may not be enabled or is disconnected');
    }
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();
  
  if (!target || target === 'all') {
    await clearRedisCache();
    await clearLocalCache();
  } else if (target === 'redis') {
    await clearRedisCache();
  } else if (target === 'local') {
    await clearLocalCache();
  } else {
    console.error('Invalid target. Use: all, redis, or local');
    process.exit(1);
  }
  
  console.log('Cache clearing completed');
}

main().catch(error => {
  console.error('Error in cache clearing script:', error);
  process.exit(1);
}); 