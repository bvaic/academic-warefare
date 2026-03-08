import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://comet_user:pAsSw0rDDB69420!@172.30.241.83:27017/comet_db?authSource=admin';
const DB_NAME = 'comet_db';

let db = null;
let client = null;

async function connectDB() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    throw error;
  }
}

export async function closeDB() {
      if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('✓ MongoDB connection closed');
      }
    }

    export function getDB() {
      if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
      }
      return db;
    }

    export { connectDB };