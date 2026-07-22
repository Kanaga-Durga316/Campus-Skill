import mongoose from 'mongoose';

// In production, MONGODB_URI must be provided via environment variable.
// For MongoDB Atlas, use:
// mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
export async function connectDatabase(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('FATAL: MONGODB_URI environment variable is not set.');
    console.error('Set it in your .env file or environment (Render dashboard / Vercel env vars).');
    process.exit(1);
  }

  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
      });

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
      });

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected — attempting to reconnect...');
      });

      // Graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n${signal} received — closing MongoDB connection...`);
        await mongoose.disconnect();
        process.exit(0);
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

      return; // Success — exit the retry loop
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error instanceof Error ? error.message : error
      );

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
}
