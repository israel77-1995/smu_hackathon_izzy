import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Privacy-First Medical AI Service
 * Uses local models to ensure no health data leaves your infrastructure
 */

class MedicalAIService {
  constructor() {
    this.isInitialized = false;
    this.model = null;
    this.medicalKeywords = new Set();
    this.emergencyKeywords = new Set();
    this.confidenceThreshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.7;
    this.maxConversationLength = parseInt(process.env.MAX_CONVERSATION_LENGTH) || 50;
  }

  async initialize() {
    try {
      logger.info('Initializing Medical AI Service...');
      
      // Load medical keywords and emergency patterns
      await this.loadMedicalVocabulary();
      await this.loadEmergencyPatterns();
      
      // Initialize local medical model (placeholder for now)
      await this.initializeLocalModel();
      
      this.isInitialized = true;
      logger.info('Medical AI Service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Medical AI Service:', error);
      throw error;
    }
  }

  async loadMedicalVocabulary() {
    // Medical terminology and symptoms
    this.medicalKeywords = new Set([
      // Symptoms
      'pain', 'headache', 'fever', 'nausea', 'vomiting', 'diarrhea', 'constipation',
      'fatigue', 'weakness', 'dizziness', 'shortness of breath', 'chest pain',
      'abdominal pain', 'back pain', 'joint pain', 'muscle pain', 'sore throat',
      'cough', 'runny nose', 'congestion', 'rash', 'itching', 'swelling',
      
      // Mental health
      'anxiety', 'depression', 'stress', 'panic', 'worry', 'sad', 'hopeless',
      'overwhelmed', 'insomnia', 'sleep problems', 'mood swings', 'irritable',
      
      // Medical conditions
      'diabetes', 'hypertension', 'asthma', 'allergies', 'migraine', 'arthritis',
      'heart disease', 'stroke', 'cancer', 'infection', 'flu', 'cold',
      
      // Body parts
      'head', 'neck', 'chest', 'abdomen', 'back', 'arms', 'legs', 'hands', 'feet',
      'heart', 'lungs', 'stomach', 'liver', 'kidneys', 'brain', 'eyes', 'ears'
    ]);
  }

  async loadEmergencyPatterns() {
    // Emergency and crisis keywords
    this.emergencyKeywords = new Set([
      'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
      'self harm', 'cutting', 'overdose', 'emergency', 'urgent', 'crisis',
      'chest pain', 'can\'t breathe', 'severe pain', 'bleeding', 'unconscious',
      'heart attack', 'stroke', 'seizure', 'allergic reaction', 'poisoning'
    ]);
  }

  async initializeLocalModel() {
    // For now, we'll use a rule-based system with medical knowledge
    // In production, you would load a local medical model like:
    // - BioBERT fine-tuned for medical Q&A
    // - Local deployment of medical LLM
    // - Custom trained model on medical data
    
    logger.info('Using rule-based medical AI (local processing only)');
    this.model = {
      type: 'rule-based',
      version: '1.0.0',
      privacy: 'local-only'
    };
  }

  async processHealthQuery(message, conversationHistory = [], userProfile = {}) {
    if (!this.isInitialized) {
      throw new Error('Medical AI Service not initialized');
    }

    try {
      // Analyze message for medical content
      const analysis = await this.analyzeMessage(message);
      
      // Check for emergency situations
      const emergencyCheck = this.detectEmergency(message);
      
      // Generate appropriate response
      const response = await this.generateResponse(message, analysis, conversationHistory, userProfile);
      
      return {
        response: response.text,
        confidence: response.confidence,
        isEmergency: emergencyCheck.isEmergency,
        emergencyLevel: emergencyCheck.level,
        medicalTopics: analysis.topics,
        recommendations: response.recommendations,
        disclaimers: this.getMedicalDisclaimers(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error processing health query:', error);
      return this.getErrorResponse();
    }
  }

  async analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\s+/);
    
    const medicalTerms = words.filter(word => this.medicalKeywords.has(word));
    const topics = this.identifyMedicalTopics(lowerMessage);
    
    return {
      medicalTerms,
      topics,
      sentiment: this.analyzeSentiment(lowerMessage),
      complexity: this.assessComplexity(message)
    };
  }

  detectEmergency(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const keyword of this.emergencyKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          isEmergency: true,
          level: this.getEmergencyLevel(keyword),
          keyword,
          action: 'immediate_intervention'
        };
      }
    }
    
    return {
      isEmergency: false,
      level: 'none'
    };
  }

  getEmergencyLevel(keyword) {
    const criticalKeywords = ['suicide', 'kill myself', 'end my life', 'heart attack', 'can\'t breathe'];
    const highKeywords = ['hurt myself', 'self harm', 'severe pain', 'emergency'];
    
    if (criticalKeywords.some(k => keyword.includes(k))) return 'critical';
    if (highKeywords.some(k => keyword.includes(k))) return 'high';
    return 'moderate';
  }

  identifyMedicalTopics(message) {
    const topics = [];
    
    if (message.includes('pain') || message.includes('hurt')) topics.push('pain_management');
    if (message.includes('anxiety') || message.includes('stress')) topics.push('mental_health');
    if (message.includes('fever') || message.includes('sick')) topics.push('illness');
    if (message.includes('medication') || message.includes('medicine')) topics.push('medication');
    if (message.includes('sleep') || message.includes('insomnia')) topics.push('sleep_health');
    
    return topics;
  }

  analyzeSentiment(message) {
    const positiveWords = ['good', 'better', 'fine', 'well', 'happy', 'improving'];
    const negativeWords = ['bad', 'worse', 'terrible', 'awful', 'depressed', 'anxious'];
    
    const positive = positiveWords.filter(word => message.includes(word)).length;
    const negative = negativeWords.filter(word => message.includes(word)).length;
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  assessComplexity(message) {
    if (message.length > 200) return 'high';
    if (message.length > 100) return 'medium';
    return 'low';
  }

  async generateResponse(message, analysis, conversationHistory, userProfile) {
    // Rule-based response generation
    let response = '';
    let confidence = 0.8;
    let recommendations = [];

    if (analysis.topics.includes('mental_health')) {
      response = this.getMentalHealthResponse(message, analysis.sentiment);
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Practice stress-reduction techniques');
    } else if (analysis.topics.includes('pain_management')) {
      response = this.getPainManagementResponse(message);
      recommendations.push('Monitor pain levels and triggers');
      recommendations.push('Consider consulting a healthcare provider if pain persists');
    } else if (analysis.topics.includes('illness')) {
      response = this.getIllnessResponse(message);
      recommendations.push('Rest and stay hydrated');
      recommendations.push('Monitor symptoms and seek medical care if they worsen');
    } else {
      response = this.getGeneralHealthResponse(message);
      recommendations.push('Maintain a healthy lifestyle');
      recommendations.push('Regular check-ups with healthcare providers are important');
    }

    return {
      text: response,
      confidence,
      recommendations
    };
  }

  getMentalHealthResponse(message, sentiment) {
    if (sentiment === 'negative') {
      return "I understand you're going through a difficult time. It's important to know that you're not alone, and there are people who want to help. Would you like to talk about what's been troubling you? Remember, seeking professional help is a sign of strength, not weakness.";
    }
    return "It's great that you're taking care of your mental health. Mental wellness is just as important as physical health. What specific aspects of your mental health would you like to discuss?";
  }

  getPainManagementResponse(message) {
    return "I understand you're experiencing pain, which can be very challenging. Pain can have many causes and affects everyone differently. Can you describe the type of pain you're experiencing and when it started? This information can help determine the best approach for management.";
  }

  getIllnessResponse(message) {
    return "I'm sorry to hear you're not feeling well. Many illnesses are common and treatable, but it's important to monitor your symptoms. Can you tell me more about what symptoms you're experiencing and how long you've had them?";
  }

  getGeneralHealthResponse(message) {
    return "Thank you for reaching out about your health. I'm here to provide general health information and support. What specific health topic would you like to discuss today?";
  }

  getMedicalDisclaimers() {
    return [
      "This AI assistant provides general health information only and is not a substitute for professional medical advice.",
      "Always consult with a qualified healthcare provider for medical concerns.",
      "In case of emergency, contact your local emergency services immediately.",
      "This information is processed locally to protect your privacy."
    ];
  }

  getErrorResponse() {
    return {
      response: "I apologize, but I'm having trouble processing your request right now. For immediate health concerns, please contact a healthcare professional or emergency services.",
      confidence: 0,
      isEmergency: false,
      emergencyLevel: 'none',
      medicalTopics: [],
      recommendations: ['Contact a healthcare provider for medical concerns'],
      disclaimers: this.getMedicalDisclaimers(),
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const medicalAI = new MedicalAIService();

export const initializeMedicalAI = async () => {
  await medicalAI.initialize();
};

export const processHealthQuery = async (message, conversationHistory, userProfile) => {
  return await medicalAI.processHealthQuery(message, conversationHistory, userProfile);
};

export { medicalAI };
