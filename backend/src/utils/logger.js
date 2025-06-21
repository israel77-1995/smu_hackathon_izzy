import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for health data logging (with privacy considerations)
const healthDataFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, userId, action, ...meta }) => {
    // Sanitize any potential health data from logs
    const sanitizedMessage = typeof message === 'string' 
      ? message.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE]')  // Remove dates
               .replace(/\b\d{10,}\b/g, '[ID]')              // Remove long numbers (IDs)
               .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Remove emails
      : message;

    let logEntry = `${timestamp} [${level.toUpperCase()}]: ${sanitizedMessage}`;
    
    if (userId) {
      logEntry += ` | User: ${userId.substring(0, 8)}...`; // Partial user ID for privacy
    }
    
    if (action) {
      logEntry += ` | Action: ${action}`;
    }
    
    if (stack) {
      logEntry += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      logEntry += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return logEntry;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: healthDataFormat,
  defaultMeta: { 
    service: 'mobile-spo-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Audit log for health data access
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 20,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    )
  }));
}

// Health data specific logging functions
const healthDataLogger = {
  // Log health data access
  logHealthDataAccess: (userId, action, dataType, accessedBy, ipAddress) => {
    logger.info('Health data accessed', {
      userId,
      action,
      dataType,
      accessedBy,
      ipAddress,
      category: 'health_data_access'
    });
  },
  
  // Log medical AI interactions
  logMedicalAIInteraction: (userId, query, confidence, topics, isEmergency) => {
    logger.info('Medical AI interaction', {
      userId,
      queryLength: query?.length || 0,
      confidence,
      topics,
      isEmergency,
      category: 'medical_ai'
    });
  },
  
  // Log emergency events
  logEmergencyEvent: (userId, emergencyType, level, response) => {
    logger.warn('Emergency event detected', {
      userId,
      emergencyType,
      level,
      response,
      category: 'emergency'
    });
  },
  
  // Log authentication events
  logAuthEvent: (userId, event, ipAddress, userAgent) => {
    logger.info('Authentication event', {
      userId,
      event,
      ipAddress,
      userAgent: userAgent?.substring(0, 100), // Truncate user agent
      category: 'authentication'
    });
  },
  
  // Log data export/sharing
  logDataExport: (userId, exportType, recipient, dataTypes) => {
    logger.info('Data export/sharing', {
      userId,
      exportType,
      recipient,
      dataTypes,
      category: 'data_export'
    });
  },
  
  // Log security events
  logSecurityEvent: (userId, event, severity, details) => {
    logger.warn('Security event', {
      userId,
      event,
      severity,
      details,
      category: 'security'
    });
  }
};

// Performance monitoring
const performanceLogger = {
  logAPIPerformance: (endpoint, method, duration, statusCode, userId) => {
    logger.info('API performance', {
      endpoint,
      method,
      duration,
      statusCode,
      userId,
      category: 'performance'
    });
  },
  
  logDatabasePerformance: (operation, collection, duration, recordCount) => {
    logger.info('Database performance', {
      operation,
      collection,
      duration,
      recordCount,
      category: 'database_performance'
    });
  }
};

// Error tracking
const errorLogger = {
  logApplicationError: (error, context, userId) => {
    logger.error('Application error', {
      error: error.message,
      stack: error.stack,
      context,
      userId,
      category: 'application_error'
    });
  },
  
  logValidationError: (errors, endpoint, userId) => {
    logger.warn('Validation error', {
      errors,
      endpoint,
      userId,
      category: 'validation_error'
    });
  }
};

export { 
  logger, 
  healthDataLogger, 
  performanceLogger, 
  errorLogger 
};
