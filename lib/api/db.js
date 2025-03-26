// Database utility functions for MongoDB
import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from 'mongoose';

// Cache the MongoDB connection
let cachedDb = null;
let cachedMongoose = null;

// Get MongoDB connection
export const getMongoClient = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI not specified in environment variables');
  }

  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    cachedDb = client;
    console.log('MongoDB connection established');
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Get MongoDB database
export const getDatabase = async (dbName = null) => {
  const client = await getMongoClient();
  return client.db(dbName || process.env.MONGODB_DB_NAME);
};

// Get MongoDB collection
export const getCollection = async (collectionName, dbName = null) => {
  const db = await getDatabase(dbName);
  return db.collection(collectionName);
};

// Get Mongoose connection
export const getMongooseConnection = async () => {
  if (cachedMongoose) {
    return cachedMongoose;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI not specified in environment variables');
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
      console.log('Mongoose connection established');
    }
    
    cachedMongoose = mongoose;
    return mongoose;
  } catch (error) {
    console.error('Mongoose connection error:', error);
    throw error;
  }
};

// Close MongoDB connections on process exit
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    try {
      if (cachedDb) {
        await cachedDb.close();
        console.log('MongoDB connection closed');
      }
      
      if (cachedMongoose && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Mongoose connection closed');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connections:', error);
      process.exit(1);
    }
  });
} 