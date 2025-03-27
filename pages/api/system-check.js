/**
 * Super simple system check API with no dependencies
 */

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // System information
  const info = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      REDIS_URL: process.env.REDIS_URL,
      DISABLE_REDIS: process.env.DISABLE_REDIS,
      MONGODB_URI: maskConnectionString(process.env.MONGODB_URI || ''),
    },
    docker: true
  };
  
  // Return response
  return res.status(200).json(info);
}

// Helper function to mask sensitive connection string data
function maskConnectionString(uri) {
  if (!uri) return '';
  // Simple mask for username/password in URI
  return uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
} 