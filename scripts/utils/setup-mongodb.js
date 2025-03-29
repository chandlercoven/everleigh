/**
 * MongoDB Setup Script
 * 
 * This script sets up MongoDB indexes and performs initial configuration.
 * Run this script once when deploying to a new environment:
 * node scripts/setup-mongodb.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

async function setupMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Import all models to ensure indexes are created
    console.log('Creating indexes...');
    await import('../lib/models/conversation.js');

    // Create additional indexes if needed
    const db = mongoose.connection.db;
    
    // Check if indexes exist
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    for (const collection of collections) {
      console.log(`Checking indexes for collection: ${collection.name}`);
      const indexes = await db.collection(collection.name).indexes();
      console.log(`Collection ${collection.name} has ${indexes.length} indexes`);
      
      for (const index of indexes) {
        console.log(`- Index: ${JSON.stringify(index.key)} (${index.name})`);
      }
    }

    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupMongoDB(); 