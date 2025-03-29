// Test endpoint to check NextAuth URL configuration
export default function handler(req, res) {
  const config = {
    nextauth_url: process.env.NEXTAUTH_URL,
    hostname: req.headers.host,
    referer: req.headers.referer || 'none',
    x_forwarded_host: req.headers['x-forwarded-host'] || 'none',
    x_forwarded_proto: req.headers['x-forwarded-proto'] || 'none',
    request_url: `${req.method} ${req.url}`,
    request_query: req.query,
    node_env: process.env.NODE_ENV
  };
  
  res.status(200).json(config);
} 