/**
 * Simple status test endpoint without any middleware
 */
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Everleigh API is operational'
  });
} 