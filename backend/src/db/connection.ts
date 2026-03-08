import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://comet_user:pAsSw0rDDB69420!@172.30.241.83:27017/comet_db?authSource=admin';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('✓ Disconnected from MongoDB');
}
