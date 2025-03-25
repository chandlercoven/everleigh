import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log('Using existing MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    console.log(`Attempting to connect to MongoDB: ${MONGODB_URI.split('@')[0]}@***`);
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connection successful');
        return mongoose;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.error('Connection stack trace:', err.stack);
        
        // Additional diagnostic info
        console.error('MongoDB connection details:',
          {
            uri: MONGODB_URI ? `${MONGODB_URI.split('@')[0]}@***` : 'undefined',
            error_code: err.code,
            error_name: err.name
          }
        );
        
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to establish MongoDB connection:', e.message);
    console.error('Error details:', {
      name: e.name,
      code: e.code,
      stack: e.stack
    });
    
    // Print current environment variables (without sensitive info)
    console.log('Current environment:',
      {
        NODE_ENV: process.env.NODE_ENV,
        mongodb_configured: !!process.env.MONGODB_URI
      }
    );
    
    throw e;
  }

  return cached.conn;
}

export default dbConnect; 