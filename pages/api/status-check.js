export default function handler(req, res) {
  // Simple status check endpoint
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    message: 'Everleigh status check API is working',
    hostname: req.headers.host
  });
} 