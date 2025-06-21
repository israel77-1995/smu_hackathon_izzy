import express from 'express';
import { handleUSSDRequest } from '../services/ussdGateway.js';
import { logger } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for USSD requests
const ussdRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each phone number to 20 requests per minute
  keyGenerator: (req) => req.body.phoneNumber || req.ip,
  message: {
    error: 'Too many requests. Please wait before trying again.',
    continueSession: false
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * USSD Gateway Endpoint
 * Handles incoming USSD requests from telecom providers
 * 
 * Expected request format:
 * {
 *   "phoneNumber": "+27123456789",
 *   "text": "user input",
 *   "sessionId": "unique_session_id"
 * }
 */
router.post('/gateway', ussdRateLimit, async (req, res) => {
  try {
    const { phoneNumber, text, sessionId } = req.body;

    // Validate required fields
    if (!phoneNumber || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: phoneNumber and sessionId',
        continueSession: false
      });
    }

    // Sanitize phone number
    const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
    
    // Log USSD request (without sensitive data)
    logger.info('USSD gateway request', {
      phoneNumber: sanitizedPhone.substring(0, 6) + '***', // Partial phone for privacy
      sessionId,
      textLength: text ? text.length : 0,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Process USSD request
    const response = await handleUSSDRequest(sanitizedPhone, text || '', sessionId);

    // Format response for telecom provider
    const ussdResponse = {
      message: response.message,
      continueSession: response.continueSession,
      type: response.type || 'menu'
    };

    // Log response (without message content for privacy)
    logger.info('USSD gateway response', {
      sessionId,
      responseType: response.type,
      continueSession: response.continueSession,
      messageLength: response.message.length
    });

    res.json(ussdResponse);

  } catch (error) {
    logger.error('USSD gateway error:', error);
    
    res.status(500).json({
      message: 'Service temporarily unavailable. Please try again later.',
      continueSession: false,
      type: 'error'
    });
  }
});

/**
 * USSD Service Status Endpoint
 * For monitoring and health checks
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    service: 'USSD Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    supportedLanguages: ['English', 'Afrikaans', 'isiZulu', 'Sesotho', 'isiXhosa'],
    features: [
      'Health Chat',
      'Emergency Support',
      'Appointment Booking',
      'Health Tips',
      'Multi-language Support'
    ]
  });
});

/**
 * USSD Webhook for telecom provider callbacks
 * Some providers use webhooks for session management
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, sessionId, phoneNumber, data } = req.body;

    logger.info('USSD webhook received', {
      event,
      sessionId,
      phoneNumber: phoneNumber ? phoneNumber.substring(0, 6) + '***' : 'unknown'
    });

    switch (event) {
      case 'session_started':
        // Handle session start
        res.json({ status: 'acknowledged' });
        break;
        
      case 'session_ended':
        // Handle session cleanup
        res.json({ status: 'acknowledged' });
        break;
        
      case 'timeout':
        // Handle session timeout
        res.json({ status: 'acknowledged' });
        break;
        
      default:
        res.json({ status: 'unknown_event' });
    }

  } catch (error) {
    logger.error('USSD webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * USSD Analytics Endpoint
 * Provides usage statistics (anonymized)
 */
router.get('/analytics', (req, res) => {
  // In a real implementation, this would query a database
  // For now, return mock analytics data
  res.json({
    totalSessions: 1247,
    activeUsers: 89,
    popularFeatures: [
      { feature: 'Health Chat', usage: 45 },
      { feature: 'Emergency Support', usage: 25 },
      { feature: 'Health Tips', usage: 20 },
      { feature: 'Appointment Booking', usage: 10 }
    ],
    languageDistribution: [
      { language: 'English', percentage: 60 },
      { language: 'isiZulu', percentage: 20 },
      { language: 'Afrikaans', percentage: 10 },
      { language: 'Sesotho', percentage: 7 },
      { language: 'isiXhosa', percentage: 3 }
    ],
    averageSessionDuration: '2.5 minutes',
    emergencyCallsTriggered: 12,
    appointmentsBooked: 156
  });
});

/**
 * USSD Test Endpoint
 * For testing USSD flows during development
 */
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { phoneNumber = '+27123456789', text = '', sessionId = 'test_session' } = req.body;
    
    const response = await handleUSSDRequest(phoneNumber, text, sessionId);
    
    res.json({
      ...response,
      debug: {
        phoneNumber,
        text,
        sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('USSD test error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

/**
 * Utility function to sanitize phone numbers
 */
function sanitizePhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add South African country code if missing
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '27' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Middleware to validate USSD provider authentication
 * In production, this would verify the request comes from authorized telecom providers
 */
function validateUSSDProvider(req, res, next) {
  const authHeader = req.get('Authorization');
  const apiKey = req.get('X-API-Key');
  
  // In production, implement proper authentication
  if (process.env.NODE_ENV === 'production') {
    if (!authHeader && !apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        continueSession: false
      });
    }
  }
  
  next();
}

// Apply authentication middleware to sensitive endpoints
router.use('/gateway', validateUSSDProvider);
router.use('/webhook', validateUSSDProvider);

export default router;
