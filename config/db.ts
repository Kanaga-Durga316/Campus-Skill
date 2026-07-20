import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-skill-exchange';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);

    mongoose.connection.on('connected', () => {
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}
