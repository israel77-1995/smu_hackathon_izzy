import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';
import appointmentRoutes from './routes/appointments.js';
import emergencyRoutes from './routes/emergency.js';
import userRoutes from './routes/users.js';
import testRoutes from './routes/test.js';
import ussdRoutes from './routes/ussd.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { healthDataEncryption } from './middleware/encryption.js';
import {
  securityHeaders,
  healthcareRateLimit,
  auditLogger,
  sanitizeHealthInput,
  enforceDataRetention,
  privacyFilter
} from './middleware/security.js';

// Import services
import { connectDatabase } from './database/connection.js';
import { initializeMedicalAI } from './services/medicalAI.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Enhanced Security middleware for healthcare data
app.use(securityHeaders);
app.use(healthcareRateLimit);
app.use(sanitizeHealthInput);
app.use(enforceDataRetention);
app.use(privacyFilter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const apiPrefix = `/api/${process.env.API_VERSION || 'v1'}`;

// Test routes (no authentication required)
app.use(`${apiPrefix}/test`, testRoutes);

// USSD routes (special authentication for telecom providers)
app.use(`${apiPrefix}/ussd`, ussdRoutes);

// Protected routes with enhanced security and audit logging
app.use(`${apiPrefix}/auth`, auditLogger('authentication'), authRoutes);
app.use(`${apiPrefix}/chat`, auditLogger('health_data_chat'), authMiddleware, healthDataEncryption, chatRoutes);
app.use(`${apiPrefix}/health`, auditLogger('health_data_access'), authMiddleware, healthDataEncryption, healthRoutes);
app.use(`${apiPrefix}/appointments`, auditLogger('appointment_management'), authMiddleware, appointmentRoutes);
app.use(`${apiPrefix}/emergency`, auditLogger('emergency_access'), emergencyRoutes);
app.use(`${apiPrefix}/users`, auditLogger('user_management'), authMiddleware, userRoutes);

// Socket.io for real-time features
io.use((socket, next) => {
  // Add authentication for socket connections
  const token = socket.handshake.auth.token;
  if (token) {
    // Verify JWT token here
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  socket.on('join_chat', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`User ${userId} joined chat room`);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist.`
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize Medical AI
    await initializeMedicalAI();
    logger.info('Medical AI initialized successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🏥 Mobile Spo Backend running on port ${PORT}`);
      logger.info(`🔒 Privacy-first medical AI enabled`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export { app, io };
