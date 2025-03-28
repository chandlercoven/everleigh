import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Response data type for the ping endpoint
 */
interface PingResponse {
  status: string;
  timestamp: string;
  environment: string | undefined;
  serverInfo: {
    nodeVersion: string;
    nextVersion: string;
  };
}

/**
 * Error response type
 */
interface ErrorResponse {
  error: string;
}

/**
 * Simple ping endpoint for health checks
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PingResponse | ErrorResponse>
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    serverInfo: {
      nodeVersion: process.version,
      nextVersion: process.env.NEXT_RUNTIME || 'server'
    }
  });
} 