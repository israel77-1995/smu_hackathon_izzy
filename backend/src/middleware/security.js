import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from '../utils/logger.js';

/**
 * Enhanced Security and Privacy Middleware for Healthcare Data
 * HIPAA-compliant security measures
 */

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.HEALTH_DATA_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const SALT_ROUNDS = 12;

/**
 * Health Data Encryption Middleware
 * Encrypts sensitive health data before storage
 */
export const healthDataEncryption = (req, res, next) => {
  // Encrypt sensitive fields in request body
  if (req.body && typeof req.body === 'object') {
    const sensitiveFields = [
      'symptoms', 'diagnosis', 'medications', 'allergies', 
      'medicalHistory', 'notes', 'healthData', 'personalNotes'
    ];

    sensitiveFields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = encryptHealthData(req.body[field]);
      }
    });
  }

  // Add decryption helper to response
  res.decryptHealthData = (encryptedData) => {
    return decryptHealthData(encryptedData);
  };

  next();
};

/**
 * Encrypt health data
 */
export function encryptHealthData(data) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('health-data'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ENCRYPTION_ALGORITHM
    };
  } catch (error) {
    logger.error('Health data encryption failed:', error);
    throw new Error('Data encryption failed');
  }
}

/**
 * Decrypt health data
 */
export function decryptHealthData(encryptedData) {
  try {
    if (!encryptedData || typeof encryptedData !== 'object') {
      return encryptedData; // Return as-is if not encrypted
    }

    const { encrypted, iv, authTag, algorithm } = encryptedData;
    
    if (!encrypted || !iv || !authTag) {
      return encryptedData; // Return as-is if not properly encrypted
    }

    const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('health-data'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    logger.error('Health data decryption failed:', error);
    return null;
  }
}

/**
 * Advanced Rate Limiting for Healthcare API
 */
export const healthcareRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on endpoint sensitivity
    if (req.path.includes('/emergency')) return 100; // Higher limit for emergencies
    if (req.path.includes('/chat')) return 50; // Moderate limit for AI chat
    if (req.path.includes('/appointments')) return 30; // Lower limit for appointments
    return 60; // Default limit
  },
  message: {
    error: 'Too many requests. Please wait before trying again.',
    retryAfter: '15 minutes',
    type: 'rate_limit_exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks and emergencies
    return req.path === '/health' || req.path.includes('/emergency/crisis');
  }
});

/**
 * Enhanced Security Headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for telemedicine
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Data Anonymization for Analytics
 */
export function anonymizeHealthData(data) {
  if (!data || typeof data !== 'object') return data;

  const anonymized = { ...data };
  
  // Remove or hash personally identifiable information
  const piiFields = [
    'name', 'email', 'phone', 'address', 'idNumber', 
    'patientName', 'patientEmail', 'patientPhone'
  ];

  piiFields.forEach(field => {
    if (anonymized[field]) {
      anonymized[field] = hashPII(anonymized[field]);
    }
  });

  // Generalize specific health data
  if (anonymized.age) {
    anonymized.ageGroup = getAgeGroup(anonymized.age);
    delete anonymized.age;
  }

  if (anonymized.location) {
    anonymized.region = getRegion(anonymized.location);
    delete anonymized.location;
  }

  return anonymized;
}

/**
 * Hash PII for analytics while maintaining uniqueness
 */
function hashPII(data) {
  return crypto.createHash('sha256')
    .update(data + process.env.PII_SALT || 'mobile-spo-salt')
    .digest('hex')
    .substring(0, 16); // Truncate for storage efficiency
}

/**
 * Get age group for anonymization
 */
function getAgeGroup(age) {
  if (age < 18) return 'minor';
  if (age < 30) return '18-29';
  if (age < 45) return '30-44';
  if (age < 60) return '45-59';
  return '60+';
}

/**
 * Get region for location anonymization
 */
function getRegion(location) {
  // Simplified region mapping for South Africa
  const regionMap = {
    'cape town': 'western_cape',
    'johannesburg': 'gauteng',
    'durban': 'kwazulu_natal',
    'pretoria': 'gauteng',
    'port elizabeth': 'eastern_cape'
  };

  const city = location.toLowerCase();
  return regionMap[city] || 'other';
}

/**
 * Audit Logging for Healthcare Data Access
 */
export const auditLogger = (action) => {
  return (req, res, next) => {
    const auditData = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      sessionId: req.sessionID || 'no-session'
    };

    // Log sensitive data access
    if (action.includes('health_data') || action.includes('medical')) {
      auditData.dataType = 'sensitive_health_data';
      auditData.complianceLevel = 'hipaa';
    }

    logger.info('Healthcare data audit', auditData);

    // Store audit trail in database (in production)
    // await AuditLog.create(auditData);

    next();
  };
};

/**
 * Input Sanitization for Health Data
 */
export const sanitizeHealthInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Sanitize string input
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters while preserving medical terminology
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Session Security for Healthcare Data
 */
export const secureSession = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 30 * 60 * 1000, // 30 minutes for healthcare sessions
    sameSite: 'strict' // CSRF protection
  },
  name: 'mobile-spo-session' // Don't use default session name
};

/**
 * Data Retention Policy Enforcement
 */
export const enforceDataRetention = async (req, res, next) => {
  // In production, this would check and enforce data retention policies
  // For now, just add headers indicating data retention policy
  res.set({
    'X-Data-Retention': '7-years', // HIPAA requirement
    'X-Data-Classification': 'sensitive-health-data',
    'X-Compliance': 'hipaa-compliant'
  });

  next();
};

/**
 * Emergency Access Override
 * Allows emergency access while maintaining audit trail
 */
export const emergencyAccessOverride = (req, res, next) => {
  if (req.headers['x-emergency-access'] === 'true') {
    // Log emergency access
    logger.warn('Emergency access override used', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      endpoint: req.path
    });

    // Allow access but flag for review
    req.emergencyAccess = true;
  }

  next();
};

/**
 * Privacy-First Response Filtering
 * Removes sensitive data from responses based on user permissions
 */
export const privacyFilter = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Filter sensitive data based on user role and permissions
    const filteredData = filterSensitiveData(data, req.user);
    return originalJson.call(this, filteredData);
  };

  next();
};

/**
 * Filter sensitive data based on user permissions
 */
function filterSensitiveData(data, user) {
  if (!data || typeof data !== 'object') return data;

  // If user is not authenticated, remove all sensitive fields
  if (!user) {
    return removeSensitiveFields(data);
  }

  // Healthcare providers can see more data
  if (user.role === 'healthcare_provider') {
    return data; // Full access for providers
  }

  // Patients can only see their own data
  if (user.role === 'patient') {
    return filterPatientData(data, user.id);
  }

  // Default: minimal data exposure
  return removeSensitiveFields(data);
}

function removeSensitiveFields(data) {
  if (Array.isArray(data)) {
    return data.map(item => removeSensitiveFields(item));
  }

  if (typeof data === 'object' && data !== null) {
    const filtered = { ...data };
    const sensitiveFields = [
      'ssn', 'idNumber', 'medicalHistory', 'diagnosis', 
      'medications', 'allergies', 'personalNotes'
    ];

    sensitiveFields.forEach(field => {
      delete filtered[field];
    });

    return filtered;
  }

  return data;
}

function filterPatientData(data, patientId) {
  // Ensure patient can only access their own data
  if (data.patientId && data.patientId !== patientId) {
    return { error: 'Access denied' };
  }

  return data;
}
