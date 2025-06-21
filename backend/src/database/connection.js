import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }

    const options = {
      // Basic connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,

      // Health data specific options
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary'
    };

    await mongoose.connect(mongoUri, options);
    
    logger.info(`🗄️  Database connected: ${mongoose.connection.name}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('Database connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Database reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Database connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export { connectDatabase };
