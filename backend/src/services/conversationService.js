import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      confidence: Number,
      medicalTopics: [String],
      isEmergency: Boolean,
      emergencyLevel: String,
      recommendations: [String]
    }
  }],
  
  isEmergency: {
    type: Boolean,
    default: false
  },
  
  emergencyLevel: {
    type: String,
    enum: ['none', 'moderate', 'high', 'critical'],
    default: 'none'
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ userId: 1, lastActivity: -1 });
conversationSchema.index({ isEmergency: 1 });
conversationSchema.index({ createdAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

/**
 * Save a conversation message
 */
export const saveConversation = async ({ userId, conversationId, userMessage, aiResponse, metadata }) => {
  try {
    let conversation;
    
    if (conversationId) {
      // Add to existing conversation
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        throw new Error('Conversation not found');
      }
    } else {
      // Create new conversation
      conversation = new Conversation({
        userId,
        messages: []
      });
    }
    
    // Add user message
    conversation.messages.push({
      sender: 'user',
      content: userMessage,
      timestamp: new Date()
    });
    
    // Add AI response
    conversation.messages.push({
      sender: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      metadata
    });
    
    // Update conversation metadata
    if (metadata.isEmergency) {
      conversation.isEmergency = true;
      conversation.emergencyLevel = metadata.emergencyLevel;
    }
    
    conversation.lastActivity = new Date();
    
    await conversation.save();
    
    logger.info(`Conversation saved for user ${userId}`);
    return conversation;
    
  } catch (error) {
    logger.error('Error saving conversation:', error);
    throw error;
  }
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (conversationId, userId, page = 1, limit = 20) => {
  try {
    if (conversationId) {
      // Get specific conversation
      const conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId,
        isActive: true 
      });
      return conversation;
    } else {
      // Get all conversations for user
      const conversations = await Conversation.find({ 
        userId,
        isActive: true 
      })
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('_id lastActivity isEmergency emergencyLevel messages')
      .lean();
      
      // Return summary of conversations
      return conversations.map(conv => ({
        id: conv._id,
        lastActivity: conv.lastActivity,
        isEmergency: conv.isEmergency,
        emergencyLevel: conv.emergencyLevel,
        messageCount: conv.messages.length,
        lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100) + '...'
      }));
    }
    
  } catch (error) {
    logger.error('Error fetching conversation history:', error);
    throw error;
  }
};
