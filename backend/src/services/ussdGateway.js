import { logger } from '../utils/logger.js';
import { processHealthQuery } from './medicalAI.js';

/**
 * USSD Gateway Service for Feature Phone Accessibility
 * Enables healthcare access for users without smartphones
 * Supports multiple South African languages
 */

class USSDGatewayService {
  constructor() {
    this.sessions = new Map(); // Store active USSD sessions
    this.maxSessionDuration = 300000; // 5 minutes
    this.supportedLanguages = {
      '1': 'english',
      '2': 'afrikaans', 
      '3': 'isizulu',
      '4': 'sesotho',
      '5': 'isixhosa'
    };
  }

  /**
   * Main USSD request handler
   * @param {string} phoneNumber - User's phone number
   * @param {string} text - USSD input text
   * @param {string} sessionId - USSD session ID
   * @returns {Object} USSD response
   */
  async handleUSSDRequest(phoneNumber, text, sessionId) {
    try {
      logger.info('USSD request received', { phoneNumber, sessionId, textLength: text.length });

      // Get or create session
      let session = this.getSession(sessionId) || this.createSession(sessionId, phoneNumber);
      
      // Update session activity
      session.lastActivity = new Date();
      session.inputHistory.push(text);

      // Route to appropriate handler based on session state
      let response;
      if (text === '') {
        response = this.showMainMenu(session);
      } else {
        response = await this.processUserInput(session, text);
      }

      // Update session
      this.updateSession(sessionId, session);

      logger.info('USSD response generated', { 
        sessionId, 
        responseType: response.type,
        continueSession: response.continueSession 
      });

      return response;

    } catch (error) {
      logger.error('USSD request error:', error);
      return this.createErrorResponse();
    }
  }

  /**
   * Create new USSD session
   */
  createSession(sessionId, phoneNumber) {
    const session = {
      id: sessionId,
      phoneNumber,
      language: 'english',
      state: 'main_menu',
      context: {},
      inputHistory: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get existing session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && this.isSessionValid(session)) {
      return session;
    }
    return null;
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(session) {
    const now = new Date();
    const sessionAge = now - session.lastActivity;
    return sessionAge < this.maxSessionDuration;
  }

  /**
   * Update session data
   */
  updateSession(sessionId, session) {
    this.sessions.set(sessionId, session);
  }

  /**
   * Show main menu
   */
  showMainMenu(session) {
    const menu = this.getLocalizedText(session.language, 'main_menu');
    
    return {
      type: 'menu',
      message: menu,
      continueSession: true
    };
  }

  /**
   * Process user input based on current state
   */
  async processUserInput(session, input) {
    const trimmedInput = input.trim();

    switch (session.state) {
      case 'main_menu':
        return await this.handleMainMenuSelection(session, trimmedInput);
      
      case 'language_selection':
        return this.handleLanguageSelection(session, trimmedInput);
      
      case 'health_chat':
        return await this.handleHealthChat(session, trimmedInput);
      
      case 'emergency':
        return this.handleEmergency(session, trimmedInput);
      
      case 'appointment_booking':
        return this.handleAppointmentBooking(session, trimmedInput);
      
      case 'health_tips':
        return this.handleHealthTips(session, trimmedInput);
      
      default:
        return this.showMainMenu(session);
    }
  }

  /**
   * Handle main menu selections
   */
  async handleMainMenuSelection(session, input) {
    switch (input) {
      case '1': // Health Chat
        session.state = 'health_chat';
        return {
          type: 'input',
          message: this.getLocalizedText(session.language, 'health_chat_prompt'),
          continueSession: true
        };

      case '2': // Emergency
        session.state = 'emergency';
        return this.handleEmergency(session, '');

      case '3': // Appointment Booking
        session.state = 'appointment_booking';
        return {
          type: 'menu',
          message: this.getLocalizedText(session.language, 'appointment_menu'),
          continueSession: true
        };

      case '4': // Health Tips
        session.state = 'health_tips';
        return this.handleHealthTips(session, '');

      case '5': // Language
        session.state = 'language_selection';
        return {
          type: 'menu',
          message: this.getLocalizedText('english', 'language_menu'),
          continueSession: true
        };

      case '0': // Exit
        return {
          type: 'end',
          message: this.getLocalizedText(session.language, 'goodbye'),
          continueSession: false
        };

      default:
        return {
          type: 'menu',
          message: this.getLocalizedText(session.language, 'invalid_option') + '\n\n' + 
                   this.getLocalizedText(session.language, 'main_menu'),
          continueSession: true
        };
    }
  }

  /**
   * Handle health chat interactions
   */
  async handleHealthChat(session, input) {
    if (input === '0') {
      session.state = 'main_menu';
      return this.showMainMenu(session);
    }

    try {
      // Process health query using AI service
      const aiResponse = await processHealthQuery(input, [], { 
        language: session.language,
        interface: 'ussd',
        phoneNumber: session.phoneNumber 
      });

      // Format response for USSD (max 160 chars per message)
      let response = aiResponse.response;
      
      // Check for emergency
      if (aiResponse.isEmergency) {
        session.state = 'emergency';
        return this.handleEmergency(session, '');
      }

      // Truncate and format for USSD
      if (response.length > 140) {
        response = response.substring(0, 137) + '...';
      }

      response += '\n\n0. Back to menu\n*. Ask another question';

      return {
        type: 'input',
        message: response,
        continueSession: true
      };

    } catch (error) {
      logger.error('Health chat error:', error);
      return {
        type: 'input',
        message: this.getLocalizedText(session.language, 'ai_error'),
        continueSession: true
      };
    }
  }

  /**
   * Handle emergency situations
   */
  handleEmergency(session, input) {
    const emergencyInfo = this.getLocalizedText(session.language, 'emergency_info');
    
    return {
      type: 'end',
      message: emergencyInfo,
      continueSession: false
    };
  }

  /**
   * Handle appointment booking
   */
  handleAppointmentBooking(session, input) {
    if (input === '0') {
      session.state = 'main_menu';
      return this.showMainMenu(session);
    }

    // Simplified appointment booking for USSD
    const appointmentInfo = this.getLocalizedText(session.language, 'appointment_info');
    
    return {
      type: 'end',
      message: appointmentInfo,
      continueSession: false
    };
  }

  /**
   * Handle health tips
   */
  handleHealthTips(session, input) {
    if (input === '0') {
      session.state = 'main_menu';
      return this.showMainMenu(session);
    }

    const tips = this.getHealthTips(session.language);
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return {
      type: 'input',
      message: randomTip + '\n\n0. Back to menu\n*. Another tip',
      continueSession: true
    };
  }

  /**
   * Handle language selection
   */
  handleLanguageSelection(session, input) {
    if (this.supportedLanguages[input]) {
      session.language = this.supportedLanguages[input];
      session.state = 'main_menu';
      
      return {
        type: 'menu',
        message: this.getLocalizedText(session.language, 'language_changed') + '\n\n' +
                 this.getLocalizedText(session.language, 'main_menu'),
        continueSession: true
      };
    }

    return {
      type: 'menu',
      message: 'Invalid selection. Please try again.\n\n' + 
               this.getLocalizedText('english', 'language_menu'),
      continueSession: true
    };
  }

  /**
   * Get localized text
   */
  getLocalizedText(language, key) {
    const texts = {
      english: {
        main_menu: `🏥 Mobile Spo Health Assistant
1. Health Chat
2. Emergency Help
3. Book Appointment  
4. Health Tips
5. Change Language
0. Exit`,
        health_chat_prompt: 'Describe your symptoms or health question:',
        emergency_info: `🚨 EMERGENCY CONTACTS:
Crisis: 0800567567
Emergency: 10177
Suicide Prevention: 0800121314
SMS Support: 31393

If immediate danger, call 10177 now!`,
        appointment_info: `📅 APPOINTMENT BOOKING:
Call: 0800123456
SMS: Send "BOOK" to 12345
Online: mobilespo.co.za

Available 24/7 for urgent care.`,
        language_menu: `Select Language:
1. English
2. Afrikaans
3. isiZulu
4. Sesotho
5. isiXhosa`,
        language_changed: 'Language updated successfully!',
        invalid_option: 'Invalid option. Please try again.',
        goodbye: 'Thank you for using Mobile Spo. Stay healthy! 💚',
        ai_error: 'Service temporarily unavailable. For emergencies call 10177.'
      },
      // Add other languages as needed
      afrikaans: {
        main_menu: `🏥 Mobile Spo Gesondheidsassistent
1. Gesondheidskletsie
2. Noodhulp
3. Maak Afspraak
4. Gesondheidswenke
5. Verander Taal
0. Verlaat`,
        // ... other Afrikaans translations
      }
      // Add isiZulu, Sesotho, isiXhosa translations
    };

    return texts[language]?.[key] || texts.english[key] || 'Service unavailable';
  }

  /**
   * Get health tips in specified language
   */
  getHealthTips(language) {
    const tips = {
      english: [
        '💧 Drink 8 glasses of water daily for better health.',
        '🚶‍♂️ Walk 30 minutes daily to boost your mood.',
        '😴 Get 7-9 hours of sleep for better immunity.',
        '🥗 Eat 5 servings of fruits & vegetables daily.',
        '🧘‍♀️ Practice deep breathing to reduce stress.',
        '🤝 Stay connected with friends and family.',
        '☀️ Get sunlight exposure for vitamin D.',
        '🚭 Avoid smoking and excessive alcohol.'
      ]
    };

    return tips[language] || tips.english;
  }

  /**
   * Create error response
   */
  createErrorResponse() {
    return {
      type: 'end',
      message: 'Service temporarily unavailable. Please try again later.',
      continueSession: false
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!this.isSessionValid(session)) {
        this.sessions.delete(sessionId);
        logger.info('Cleaned up expired USSD session', { sessionId });
      }
    }
  }
}

// Singleton instance
const ussdGateway = new USSDGatewayService();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  ussdGateway.cleanupExpiredSessions();
}, 5 * 60 * 1000);

export { ussdGateway };
export const handleUSSDRequest = async (phoneNumber, text, sessionId) => {
  return await ussdGateway.handleUSSDRequest(phoneNumber, text, sessionId);
};
