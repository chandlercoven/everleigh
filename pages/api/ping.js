export default function handler(req, res) {
  res.status(200).json({ 
    ping: 'pong',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hostname: req.headers.host || 'unknown'
  });
} 