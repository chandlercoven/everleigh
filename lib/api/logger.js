// Structured logging utility
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Get current log level from environment
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
};

// Format log message as JSON
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta,
  });
};

// Log to appropriate output
const logToOutput = (formattedMessage) => {
  console.log(formattedMessage);
  
  // Additional logging outputs could be added here (e.g., to file, external service)
};

// Main logger object
export const logger = {
  error: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.ERROR) {
      logToOutput(formatLogMessage('ERROR', message, meta));
    }
  },
  
  warn: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.WARN) {
      logToOutput(formatLogMessage('WARN', message, meta));
    }
  },
  
  info: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
      logToOutput(formatLogMessage('INFO', message, meta));
    }
  },
  
  debug: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG) {
      logToOutput(formatLogMessage('DEBUG', message, meta));
    }
  },
  
  // Log API request (middleware)
  apiRequest: (req, res, next) => {
    const startTime = Date.now();
    
    // Add response finished listener
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      const meta = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        duration: `${duration}ms`,
        userId: req.user?.id,
      };
      
      logger[logLevel](`API ${req.method} ${req.url} ${res.statusCode}`, meta);
    });
    
    return next();
  },
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  return logger.apiRequest(req, res, next);
};

// Error logger middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('API Error', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  next(err);
}; 