import { logger } from '../utils/logger.js';

/**
 * Notification Service for Appointment System
 * Handles SMS, Email, and Push notifications
 */

class NotificationService {
  constructor() {
    this.smsProvider = process.env.SMS_PROVIDER || 'mock';
    this.emailProvider = process.env.EMAIL_PROVIDER || 'mock';
  }

  /**
   * Send SMS notification
   */
  async sendSMS(phoneNumber, message, options = {}) {
    try {
      logger.info('Sending SMS', { 
        phoneNumber: phoneNumber.substring(0, 6) + '***',
        messageLength: message.length 
      });

      // Mock SMS sending for demo
      if (this.smsProvider === 'mock') {
        return this.mockSMSSend(phoneNumber, message);
      }

      // In production, integrate with actual SMS providers like:
      // - Twilio
      // - AWS SNS
      // - African SMS providers (Clickatell, BulkSMS, etc.)
      
      return {
        success: true,
        messageId: 'sms_' + Date.now(),
        status: 'sent',
        provider: this.smsProvider
      };

    } catch (error) {
      logger.error('SMS sending failed:', error);
      throw error;
    }
  }

  /**
   * Send Email notification
   */
  async sendEmail(email, subject, message, options = {}) {
    try {
      logger.info('Sending Email', { 
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        subject 
      });

      // Mock email sending for demo
      if (this.emailProvider === 'mock') {
        return this.mockEmailSend(email, subject, message);
      }

      // In production, integrate with actual email providers like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Postmark
      
      return {
        success: true,
        messageId: 'email_' + Date.now(),
        status: 'sent',
        provider: this.emailProvider
      };

    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send Push notification
   */
  async sendPushNotification(deviceToken, title, body, data = {}) {
    try {
      logger.info('Sending Push Notification', { 
        deviceToken: deviceToken.substring(0, 10) + '***',
        title 
      });

      // Mock push notification for demo
      return this.mockPushSend(deviceToken, title, body, data);

    } catch (error) {
      logger.error('Push notification failed:', error);
      throw error;
    }
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(appointment) {
    const message = `✅ Appointment Confirmed!

📅 Date: ${appointment.appointmentDate.toDateString()}
⏰ Time: ${appointment.appointmentTime.start}
👨‍⚕️ Provider: ${appointment.providerName}
🏥 Location: ${appointment.facilityName}
📍 Queue Position: #${appointment.queuePosition}
⏱️ Est. Wait: ${appointment.estimatedWaitTime} min

💡 Arrive 15 minutes early
📱 Track your queue position in the app

Reply CANCEL to cancel appointment.`;

    const emailSubject = 'Appointment Confirmed - Mobile Spo';
    const emailMessage = `
<h2>🏥 Appointment Confirmed</h2>

<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3>📅 Appointment Details</h3>
  <p><strong>Date:</strong> ${appointment.appointmentDate.toDateString()}</p>
  <p><strong>Time:</strong> ${appointment.appointmentTime.start}</p>
  <p><strong>Provider:</strong> ${appointment.providerName}</p>
  <p><strong>Location:</strong> ${appointment.facilityName}</p>
</div>

<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h4>🚀 Queue Information</h4>
  <p><strong>Your Position:</strong> #${appointment.queuePosition}</p>
  <p><strong>Estimated Wait:</strong> ${appointment.estimatedWaitTime} minutes</p>
</div>

<div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h4>📋 Preparation Instructions</h4>
  <ul>
    ${appointment.preparationInstructions.map(instruction => 
      `<li>${typeof instruction === 'string' ? instruction : instruction.instruction}</li>`
    ).join('')}
  </ul>
</div>

<p><strong>💚 Mobile Spo Team</strong><br>
Making healthcare accessible to everyone, everywhere.</p>
`;

    try {
      // Send SMS
      if (appointment.patientPhone) {
        await this.sendSMS(appointment.patientPhone, message);
      }

      // Send Email
      if (appointment.patientEmail) {
        await this.sendEmail(appointment.patientEmail, emailSubject, emailMessage);
      }

      logger.info('Appointment confirmation sent', { 
        appointmentId: appointment.id || appointment._id 
      });

    } catch (error) {
      logger.error('Failed to send appointment confirmation:', error);
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(appointment, reminderType = '24h') {
    const reminderMessages = {
      '24h': `📅 Reminder: You have an appointment tomorrow!

👨‍⚕️ ${appointment.providerName}
⏰ ${appointment.appointmentTime.start}
🏥 ${appointment.facilityName}

Current queue position: #${appointment.queuePosition}
Estimated wait: ${appointment.estimatedWaitTime} min

💡 Prepare your documents and questions
📱 Track real-time updates in the app`,

      '2h': `⏰ Your appointment is in 2 hours!

👨‍⚕️ ${appointment.providerName}
⏰ ${appointment.appointmentTime.start}
🏥 ${appointment.facilityName}

🚗 Please leave now if traveling
📍 Arrive 15 minutes early
📱 Current queue position: #${appointment.queuePosition}`,

      '30m': `🔔 Your appointment is in 30 minutes!

You're #${appointment.queuePosition} in the queue
Estimated wait: ${appointment.estimatedWaitTime} min

Please check in at reception when you arrive.`
    };

    const message = reminderMessages[reminderType];
    if (!message) return;

    try {
      // Send SMS reminder
      if (appointment.patientPhone) {
        await this.sendSMS(appointment.patientPhone, message);
      }

      // Send push notification if device token available
      if (appointment.deviceToken) {
        await this.sendPushNotification(
          appointment.deviceToken,
          'Appointment Reminder',
          `Your appointment with ${appointment.providerName} is coming up!`
        );
      }

      logger.info('Appointment reminder sent', { 
        appointmentId: appointment.id || appointment._id,
        reminderType 
      });

    } catch (error) {
      logger.error('Failed to send appointment reminder:', error);
    }
  }

  /**
   * Send queue position update
   */
  async sendQueueUpdate(appointment) {
    const message = `📍 Queue Update!

Your position: #${appointment.queuePosition}
Estimated wait: ${appointment.estimatedWaitTime} min

${appointment.queuePosition === 1 ? 
  '🎉 You\'re next! Please prepare to be called.' :
  '⏱️ Updated wait time based on current queue.'
}

📱 Track real-time updates in the Mobile Spo app`;

    try {
      // Send SMS update
      if (appointment.patientPhone) {
        await this.sendSMS(appointment.patientPhone, message);
      }

      // Send push notification
      if (appointment.deviceToken) {
        await this.sendPushNotification(
          appointment.deviceToken,
          'Queue Position Updated',
          `You're now #${appointment.queuePosition} in the queue`
        );
      }

    } catch (error) {
      logger.error('Failed to send queue update:', error);
    }
  }

  // Mock implementations for demo
  mockSMSSend(phoneNumber, message) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: 'mock_sms_' + Date.now(),
          status: 'delivered',
          provider: 'mock',
          timestamp: new Date().toISOString()
        });
      }, 500); // Simulate network delay
    });
  }

  mockEmailSend(email, subject, message) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: 'mock_email_' + Date.now(),
          status: 'delivered',
          provider: 'mock',
          timestamp: new Date().toISOString()
        });
      }, 800); // Simulate network delay
    });
  }

  mockPushSend(deviceToken, title, body, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: 'mock_push_' + Date.now(),
          status: 'delivered',
          provider: 'mock',
          timestamp: new Date().toISOString()
        });
      }, 300); // Simulate network delay
    });
  }
}

// Singleton instance
const notificationService = new NotificationService();

// Export individual functions for convenience
export const sendSMS = (phoneNumber, message, options) => 
  notificationService.sendSMS(phoneNumber, message, options);

export const sendEmail = (email, subject, message, options) => 
  notificationService.sendEmail(email, subject, message, options);

export const sendPushNotification = (deviceToken, title, body, data) => 
  notificationService.sendPushNotification(deviceToken, title, body, data);

export const sendAppointmentConfirmation = (appointment) => 
  notificationService.sendAppointmentConfirmation(appointment);

export const sendAppointmentReminder = (appointment, reminderType) => 
  notificationService.sendAppointmentReminder(appointment, reminderType);

export const sendQueueUpdate = (appointment) => 
  notificationService.sendQueueUpdate(appointment);

export default notificationService;
