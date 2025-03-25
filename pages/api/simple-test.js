export default function handler(req, res) {
  // Simple health check endpoint
  res.status(200).json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
} 