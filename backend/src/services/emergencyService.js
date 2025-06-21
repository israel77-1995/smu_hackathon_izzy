import { logger, healthDataLogger } from '../utils/logger.js';
import { io } from '../server.js';

/**
 * Emergency Response Service
 * Handles crisis detection and emergency interventions
 */

/**
 * Detect emergency situations in user messages
 */
export const detectEmergency = (message, userProfile = {}) => {
  const lowerMessage = message.toLowerCase();
  
  // Critical emergency keywords
  const criticalKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
    'overdose', 'pills', 'hanging', 'jumping', 'cutting deep'
  ];
  
  // High priority keywords
  const highKeywords = [
    'hurt myself', 'self harm', 'cutting', 'burning myself',
    'chest pain', 'can\'t breathe', 'heart attack', 'stroke'
  ];
  
  // Moderate priority keywords
  const moderateKeywords = [
    'emergency', 'urgent', 'crisis', 'help me', 'severe pain',
    'bleeding', 'unconscious', 'allergic reaction'
  ];
  
  // Check for critical emergencies
  for (const keyword of criticalKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        isEmergency: true,
        level: 'critical',
        keyword,
        confidence: 0.95,
        action: 'immediate_intervention'
      };
    }
  }
  
  // Check for high priority emergencies
  for (const keyword of highKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        isEmergency: true,
        level: 'high',
        keyword,
        confidence: 0.85,
        action: 'urgent_response'
      };
    }
  }
  
  // Check for moderate emergencies
  for (const keyword of moderateKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        isEmergency: true,
        level: 'moderate',
        keyword,
        confidence: 0.75,
        action: 'monitor_and_support'
      };
    }
  }
  
  return {
    isEmergency: false,
    level: 'none',
    confidence: 0
  };
};

/**
 * Handle emergency response based on severity level
 */
export const handleEmergencyResponse = async (userId, message, emergencyLevel) => {
  try {
    // Log emergency event
    healthDataLogger.logEmergencyEvent(userId, 'crisis_detected', emergencyLevel, 'auto_response');
    
    const response = {
      userId,
      emergencyLevel,
      timestamp: new Date().toISOString(),
      resources: getEmergencyResources(),
      actions: []
    };
    
    switch (emergencyLevel) {
      case 'critical':
        response.actions = await handleCriticalEmergency(userId, message);
        break;
        
      case 'high':
        response.actions = await handleHighEmergency(userId, message);
        break;
        
      case 'moderate':
        response.actions = await handleModerateEmergency(userId, message);
        break;
    }
    
    // Send real-time notification to user
    io.to(`user_${userId}`).emit('emergency_response', response);
    
    logger.warn(`Emergency response activated for user ${userId}: ${emergencyLevel}`);
    return response;
    
  } catch (error) {
    logger.error('Error handling emergency response:', error);
    throw error;
  }
};

/**
 * Handle critical emergency (suicide risk, immediate danger)
 */
const handleCriticalEmergency = async (userId, message) => {
  const actions = [
    {
      type: 'immediate_intervention',
      message: '🚨 IMMEDIATE HELP NEEDED - You are not alone. Please reach out for help right now.',
      priority: 'critical'
    },
    {
      type: 'emergency_contacts',
      message: 'Please call one of these numbers immediately:',
      contacts: [
        { name: 'Suicide Prevention Lifeline', number: '0800 12 13 14', available: '24/7' },
        { name: 'Crisis Helpline', number: '0800 567 567', available: '24/7' },
        { name: 'Emergency Services', number: '10177', available: '24/7' }
      ]
    },
    {
      type: 'safety_plan',
      message: 'If you are in immediate danger, please:',
      steps: [
        'Call emergency services (10177) immediately',
        'Go to your nearest hospital emergency room',
        'Call a trusted friend or family member',
        'Remove any means of self-harm from your immediate area'
      ]
    }
  ];
  
  // TODO: In production, this could trigger:
  // - Automatic notification to emergency contacts
  // - Alert to healthcare providers
  // - Geolocation-based emergency services
  
  return actions;
};

/**
 * Handle high priority emergency
 */
const handleHighEmergency = async (userId, message) => {
  const actions = [
    {
      type: 'urgent_support',
      message: 'I\'m concerned about you. Please consider reaching out for professional help.',
      priority: 'high'
    },
    {
      type: 'crisis_resources',
      message: 'Here are some resources that can help:',
      contacts: [
        { name: 'Crisis Helpline', number: '0800 567 567', available: '24/7' },
        { name: 'SMS Counseling', number: '31393', available: '24/7', note: 'Text "Hi"' }
      ]
    },
    {
      type: 'safety_check',
      message: 'Are you in a safe place right now? Do you have someone you can talk to?'
    }
  ];
  
  return actions;
};

/**
 * Handle moderate emergency
 */
const handleModerateEmergency = async (userId, message) => {
  const actions = [
    {
      type: 'supportive_response',
      message: 'I understand you\'re going through a difficult time. Help is available.',
      priority: 'moderate'
    },
    {
      type: 'resources',
      message: 'Consider these support options:',
      contacts: [
        { name: 'Crisis Helpline', number: '0800 567 567', available: '24/7' },
        { name: 'Mental Health Support', note: 'Speak with a healthcare provider' }
      ]
    },
    {
      type: 'coping_strategies',
      message: 'Some immediate coping strategies:',
      strategies: [
        'Take slow, deep breaths',
        'Reach out to a trusted friend or family member',
        'Consider professional counseling',
        'Use grounding techniques (5-4-3-2-1 method)'
      ]
    }
  ];
  
  return actions;
};

/**
 * Get emergency resources for South Africa
 */
export const getEmergencyResources = () => {
  return {
    crisis: {
      name: 'Crisis Helpline',
      number: process.env.EMERGENCY_CRISIS_LINE || '0800 567 567',
      description: 'Free 24/7 mental health crisis support',
      available: '24/7'
    },
    suicide: {
      name: 'Suicide Prevention Lifeline',
      number: process.env.EMERGENCY_SUICIDE_PREVENTION || '0800 12 13 14',
      description: 'Immediate suicide prevention support',
      available: '24/7'
    },
    emergency: {
      name: 'Emergency Services',
      number: process.env.EMERGENCY_SERVICES || '10177',
      description: 'Police, ambulance, fire services',
      available: '24/7'
    },
    sms: {
      name: 'SMS Counseling',
      number: process.env.EMERGENCY_SMS || '31393',
      description: 'Text "Hi" for confidential support',
      available: '24/7'
    },
    local: {
      name: 'Nearest Clinic',
      description: 'Serenity Wellness Center - 2.3km away',
      hours: 'Open 24/7 • Walk-ins welcome'
    }
  };
};
