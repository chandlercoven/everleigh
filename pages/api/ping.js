import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import * as os from 'os';

// Helper function to check MongoDB connection
async function checkMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return { status: 'error', message: 'MongoDB URI not configured' };
  }
  
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    return { status: 'ok', message: 'Connected to MongoDB' };
  } catch (error) {
    return { 
      status: 'error', 
      message: 'Failed to connect to MongoDB', 
      error: error.message 
    };
  } finally {
    await client.close();
  }
}

// Helper function to check n8n connectivity
async function checkN8n() {
  const n8nUrl = process.env.N8N_SERVER_URL;
  if (!n8nUrl) {
    return { status: 'skipped', message: 'n8n URL not configured' };
  }
  
  try {
    // Just try to connect to n8n
    const response = await fetch(n8nUrl, {
      timeout: 5000,
      method: 'HEAD'
    });
    
    if (response.ok || response.status === 302) {
      return { status: 'ok', message: 'n8n service is responsive' };
    } else {
      return { 
        status: 'error', 
        message: `n8n returned status ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      status: 'warning', 
      message: 'Could not connect to n8n service, but continuing', 
      error: error.message 
    };
  }
}

// Helper function to check Redis if used
async function checkRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return { status: 'skipped', message: 'Redis URL not configured' };
  }
  
  // Dynamically import Redis to avoid issues if it's not used
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: redisUrl });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return { status: 'ok', message: 'Connected to Redis' };
  } catch (error) {
    return { 
      status: 'warning', 
      message: 'Failed to connect to Redis, but continuing', 
      error: error.message 
    };
  }
}

// Get system resource status
function getSystemStatus() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemoryPercentage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(1);
  
  const cpuLoad = os.loadavg()[0];
  const cpuCores = os.cpus().length;
  const cpuUsagePercentage = (cpuLoad / cpuCores * 100).toFixed(1);
  
  return {
    status: 'ok',
    uptime: os.uptime(),
    memory: {
      total: Math.round(totalMemory / 1024 / 1024),
      free: Math.round(freeMemory / 1024 / 1024),
      used: `${usedMemoryPercentage}%`
    },
    cpu: {
      cores: cpuCores,
      load: cpuLoad,
      usage: `${cpuUsagePercentage}%`
    }
  };
}

export default async function handler(req, res) {
  try {
    // Run checks in parallel for better performance
    const [mongoStatus, n8nStatus, redisStatus, systemStatus] = await Promise.all([
      checkMongoDB(),
      checkN8n(),
      checkRedis(),
      Promise.resolve(getSystemStatus())
    ]);
    
    // Determine overall status - only MongoDB is critical
    const isHealthy = mongoStatus.status === 'ok';
    
    const responseStatus = isHealthy ? 200 : 503;
    
    res.status(responseStatus).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV,
      checks: {
        mongodb: mongoStatus,
        n8n: n8nStatus,
        redis: redisStatus,
        system: systemStatus
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed to execute',
      error: error.message
    });
  }
} 