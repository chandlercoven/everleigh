import rateLimit from 'express-rate-limit';

// Create a rate limiter middleware
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 requests per minute
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      error: 'Too many requests, please try again later.'
    }
  };

  // Merge default options with provided options
  const limiterOptions = { ...defaultOptions, ...options };
  
  // Create and return the rate limiter instance
  return rateLimit(limiterOptions);
};

// API rate limiter with different limits based on the endpoint
export const apiLimiter = {
  // More strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: {
      success: false,
      error: 'Too many login attempts, please try again later.'
    }
  }),
  
  // Standard rate limiting for general API endpoints
  standard: createRateLimiter(),
  
  // Relaxed rate limiting for read-only endpoints
  readonly: createRateLimiter({
    max: 100, // 100 requests per minute
  }),
  
  // Strict rate limiting for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  })
}; 