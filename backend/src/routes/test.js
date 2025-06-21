import express from 'express';
import { body, validationResult } from 'express-validator';
import { processHealthQuery } from '../services/medicalAI.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/v1/test/chat
 * Test endpoint for medical AI (no authentication required)
 */
router.post('/chat', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message } = req.body;

    logger.info(`Processing test health query: ${message}`);

    // Process message with medical AI (no user context for test)
    const aiResponse = await processHealthQuery(message, [], {});

    // Handle emergency situations
    if (aiResponse.isEmergency) {
      logger.warn(`Emergency detected in test query: ${aiResponse.emergencyLevel}`);
    }

    // Prepare response
    const response = {
      success: true,
      data: {
        message: aiResponse.response,
        confidence: aiResponse.confidence,
        medicalTopics: aiResponse.medicalTopics,
        recommendations: aiResponse.recommendations,
        disclaimers: aiResponse.disclaimers,
        isEmergency: aiResponse.isEmergency,
        emergencyLevel: aiResponse.emergencyLevel,
        timestamp: aiResponse.timestamp
      }
    };

    // Add emergency information if detected
    if (aiResponse.isEmergency) {
      response.data.emergency = {
        level: aiResponse.emergencyLevel,
        resources: {
          crisis: {
            name: 'Crisis Helpline',
            number: '0800567567',
            description: 'Free 24/7 mental health crisis support',
            available: '24/7'
          },
          suicide: {
            name: 'Suicide Prevention Lifeline',
            number: '0800121314',
            description: 'Immediate suicide prevention support',
            available: '24/7'
          },
          emergency: {
            name: 'Emergency Services',
            number: '10177',
            description: 'Police, ambulance, fire services',
            available: '24/7'
          },
          sms: {
            name: 'SMS Counseling',
            number: '31393',
            description: 'Text "Hi" for confidential support',
            available: '24/7'
          }
        }
      };
    }

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error processing test chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/test/health
 * Test health endpoint with features info
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      medicalAI: 'enabled',
      emergencyDetection: 'enabled',
      privacyFirst: 'enabled',
      localProcessing: 'enabled'
    }
  });
});

export default router;
