import express from 'express';
import { body, validationResult } from 'express-validator';
import { processHealthQuery } from '../services/medicalAI.js';
import { saveConversation, getConversationHistory } from '../services/conversationService.js';
import { detectEmergency, handleEmergencyResponse } from '../services/emergencyService.js';
import { logger } from '../utils/logger.js';
import { io } from '../server.js';

const router = express.Router();

/**
 * POST /api/v1/chat/test
 * Test endpoint for medical AI (no authentication required)
 */
router.post('/test', [
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

// Validation middleware for chat messages
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('conversationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid conversation ID'),
];

/**
 * POST /api/v1/chat/message
 * Send a message to the medical AI
 */
router.post('/message', validateChatMessage, async (req, res) => {
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

    const { message, conversationId } = req.body;
    const userId = req.user.id;

    logger.info(`Processing health query for user ${userId}`);

    // Get conversation history
    const conversationHistory = conversationId 
      ? await getConversationHistory(conversationId, userId)
      : [];

    // Get user profile for context
    const userProfile = {
      age: req.user.profile?.age,
      gender: req.user.profile?.gender,
      conditions: req.user.healthProfile?.conditions || [],
      medications: req.user.healthProfile?.medications || []
    };

    // Process message with medical AI
    const aiResponse = await processHealthQuery(message, conversationHistory, userProfile);

    // Handle emergency situations
    if (aiResponse.isEmergency) {
      logger.warn(`Emergency detected for user ${userId}: ${aiResponse.emergencyLevel}`);
      
      // Trigger emergency response
      await handleEmergencyResponse(userId, message, aiResponse.emergencyLevel);
      
      // Notify via socket if user is connected
      io.to(`user_${userId}`).emit('emergency_detected', {
        level: aiResponse.emergencyLevel,
        message: 'Emergency support resources have been activated',
        timestamp: new Date().toISOString()
      });
    }

    // Save conversation
    const conversation = await saveConversation({
      userId,
      conversationId,
      userMessage: message,
      aiResponse: aiResponse.response,
      metadata: {
        confidence: aiResponse.confidence,
        medicalTopics: aiResponse.medicalTopics,
        isEmergency: aiResponse.isEmergency,
        emergencyLevel: aiResponse.emergencyLevel,
        recommendations: aiResponse.recommendations
      }
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        conversationId: conversation._id,
        message: aiResponse.response,
        confidence: aiResponse.confidence,
        medicalTopics: aiResponse.medicalTopics,
        recommendations: aiResponse.recommendations,
        disclaimers: aiResponse.disclaimers,
        isEmergency: aiResponse.isEmergency,
        timestamp: aiResponse.timestamp
      }
    };

    // Add emergency information if detected
    if (aiResponse.isEmergency) {
      response.data.emergency = {
        level: aiResponse.emergencyLevel,
        resources: {
          crisis: process.env.EMERGENCY_CRISIS_LINE,
          suicide: process.env.EMERGENCY_SUICIDE_PREVENTION,
          emergency: process.env.EMERGENCY_SERVICES,
          sms: process.env.EMERGENCY_SMS
        }
      };
    }

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/chat/conversations
 * Get user's conversation history
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await getConversationHistory(
      null, 
      userId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: conversations.length
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/chat/conversation/:id
 * Get specific conversation details
 */
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await getConversationHistory(id, userId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/v1/chat/conversation/:id
 * Delete a conversation
 */
router.delete('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Implementation would go here
    // For now, return success
    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/chat/feedback
 * Submit feedback on AI response
 */
router.post('/feedback', [
  body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  body('messageId').isMongoId().withMessage('Invalid message ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim().isLength({ max: 500 }).withMessage('Feedback too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId, messageId, rating, feedback } = req.body;
    const userId = req.user.id;

    // Save feedback (implementation would go here)
    logger.info(`Feedback received from user ${userId}: rating ${rating}`);

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
