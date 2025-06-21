import Appointment from '../models/Appointment.js';
import HealthcareProvider from '../models/HealthcareProvider.js';
import { logger } from '../utils/logger.js';
import { sendSMS, sendEmail } from './notifications.js';

/**
 * Automated Appointment Booking Service
 * Key selling point: Stress-free booking, reminders, queue cutting, reducing hospital visits
 */

class AppointmentBookingService {
  constructor() {
    this.queueManagement = new Map(); // Track queue positions
    this.reminderScheduler = new Map(); // Track scheduled reminders
  }

  /**
   * Smart appointment booking with AI-powered optimization
   */
  async bookAppointment(appointmentData, patientId) {
    try {
      logger.info('Starting appointment booking process', { patientId, type: appointmentData.type });

      // Validate and optimize appointment request
      const optimizedData = await this.optimizeAppointmentRequest(appointmentData);
      
      // Find best available provider and time slot
      const { provider, timeSlot } = await this.findOptimalSlot(optimizedData);
      
      if (!provider || !timeSlot) {
        throw new Error('No available slots found for the requested criteria');
      }

      // Create appointment with smart defaults
      const appointment = new Appointment({
        ...optimizedData,
        patientId,
        providerId: provider._id,
        providerName: provider.fullName,
        facilityName: provider.primaryFacility.name,
        facilityAddress: provider.primaryFacility.address,
        appointmentTime: timeSlot,
        status: this.determineInitialStatus(optimizedData),
        queuePosition: await this.calculateQueuePosition(provider._id, optimizedData.appointmentDate),
        estimatedWaitTime: await this.calculateWaitTime(provider._id, optimizedData.appointmentDate),
        preparationInstructions: this.generatePreparationInstructions(optimizedData.type),
        cost: await this.calculateCost(provider, optimizedData)
      });

      await appointment.save();

      // Trigger automated workflows
      await this.triggerAutomatedWorkflows(appointment);

      logger.info('Appointment booked successfully', { 
        appointmentId: appointment._id,
        providerId: provider._id,
        appointmentDate: appointment.appointmentDate
      });

      return {
        success: true,
        appointment,
        provider,
        estimatedWaitTime: appointment.estimatedWaitTime,
        queuePosition: appointment.queuePosition,
        preparationInstructions: appointment.preparationInstructions
      };

    } catch (error) {
      logger.error('Appointment booking failed:', error);
      throw error;
    }
  }

  /**
   * AI-powered appointment request optimization
   */
  async optimizeAppointmentRequest(data) {
    const optimized = { ...data };

    // Smart date optimization
    if (!optimized.appointmentDate) {
      optimized.appointmentDate = this.suggestOptimalDate(data.urgency, data.type);
    }

    // Auto-detect appointment type from symptoms/description
    if (!optimized.type && data.symptoms) {
      optimized.type = this.detectAppointmentType(data.symptoms);
    }

    // Set appropriate duration based on type
    if (!optimized.duration) {
      optimized.duration = this.getStandardDuration(optimized.type);
    }

    // Auto-assign priority based on symptoms and urgency
    if (!optimized.priority) {
      optimized.priority = this.calculatePriority(data.symptoms, data.urgency);
    }

    return optimized;
  }

  /**
   * Find optimal provider and time slot using smart matching
   */
  async findOptimalSlot(appointmentData) {
    try {
      // Find providers based on specialty and location preferences
      const providers = await this.findSuitableProviders(appointmentData);
      
      if (providers.length === 0) {
        throw new Error('No suitable providers found');
      }

      // Score and rank providers
      const rankedProviders = await this.rankProviders(providers, appointmentData);

      // Find best time slot across top providers
      for (const provider of rankedProviders) {
        const availableSlots = await this.getAvailableSlots(
          provider._id, 
          appointmentData.appointmentDate,
          appointmentData.duration
        );

        if (availableSlots.length > 0) {
          const optimalSlot = this.selectOptimalTimeSlot(availableSlots, appointmentData);
          return { provider, timeSlot: optimalSlot };
        }
      }

      // If no slots available, suggest alternative dates
      const alternatives = await this.suggestAlternativeDates(rankedProviders[0], appointmentData);
      throw new Error(`No slots available on requested date. Suggested alternatives: ${alternatives.join(', ')}`);

    } catch (error) {
      logger.error('Error finding optimal slot:', error);
      throw error;
    }
  }

  /**
   * Smart provider ranking algorithm
   */
  async rankProviders(providers, appointmentData) {
    const scored = providers.map(provider => {
      let score = 0;

      // Rating weight (40%)
      score += provider.rating.average * 8;

      // Distance weight (30%) - if location provided
      if (appointmentData.preferredLocation) {
        const distance = this.calculateDistance(
          appointmentData.preferredLocation,
          provider.primaryFacility.address.coordinates
        );
        score += Math.max(0, 15 - distance); // Closer = higher score
      }

      // Availability weight (20%)
      const availabilityScore = provider.statistics.completedAppointments / 
                               Math.max(1, provider.statistics.totalAppointments);
      score += availabilityScore * 10;

      // Wait time weight (10%)
      const waitTimeScore = Math.max(0, 5 - (provider.statistics.averageWaitTime / 10));
      score += waitTimeScore;

      return { ...provider.toObject(), score };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Automated workflow triggers
   */
  async triggerAutomatedWorkflows(appointment) {
    try {
      // Schedule confirmation reminder
      await this.scheduleReminder(appointment, 'confirmation', 1); // 1 hour

      // Schedule pre-appointment reminders
      await this.scheduleReminder(appointment, 'reminder_24h', 24); // 24 hours
      await this.scheduleReminder(appointment, 'reminder_2h', 2); // 2 hours

      // Auto-generate preparation checklist
      await this.generateAndSendPreparationChecklist(appointment);

      // Insurance verification (if applicable)
      if (appointment.insurance && appointment.insurance.provider) {
        await this.initiateInsuranceVerification(appointment);
      }

      // Queue position updates
      await this.setupQueuePositionUpdates(appointment);

      logger.info('Automated workflows triggered', { appointmentId: appointment._id });

    } catch (error) {
      logger.error('Error triggering automated workflows:', error);
    }
  }

  /**
   * Smart queue management with position cutting for urgent cases
   */
  async calculateQueuePosition(providerId, appointmentDate) {
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.countDocuments({
      providerId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['confirmed', 'rescheduled'] }
    });

    return existingAppointments + 1;
  }

  /**
   * Dynamic wait time calculation
   */
  async calculateWaitTime(providerId, appointmentDate) {
    const provider = await HealthcareProvider.findById(providerId);
    if (!provider) return 30; // Default 30 minutes

    // Base wait time from provider statistics
    let waitTime = provider.statistics.averageWaitTime || 15;

    // Adjust based on day of week and time
    const dayOfWeek = new Date(appointmentDate).getDay();
    if (dayOfWeek === 1) waitTime *= 1.3; // Mondays are busier
    if (dayOfWeek === 5) waitTime *= 1.2; // Fridays are busier

    // Adjust based on current queue length
    const queueLength = await this.getQueueLength(providerId, appointmentDate);
    waitTime += queueLength * 5; // 5 minutes per person in queue

    return Math.round(waitTime);
  }

  /**
   * Generate smart preparation instructions
   */
  generatePreparationInstructions(appointmentType) {
    const instructions = {
      general_consultation: [
        'Bring your ID document and medical aid card',
        'List all current medications you are taking',
        'Prepare questions you want to ask the doctor',
        'Arrive 15 minutes early for check-in'
      ],
      mental_health_therapy: [
        'Complete the mood tracking journal if provided',
        'Prepare topics you want to discuss',
        'Bring a notebook for taking notes',
        'Ensure you have privacy for the session'
      ],
      specialist_consultation: [
        'Bring your referral letter from your GP',
        'Bring any previous test results or scans',
        'List your symptoms and when they started',
        'Prepare a timeline of your medical history'
      ],
      emergency_consultation: [
        'Bring your ID and medical aid card',
        'List current symptoms and severity',
        'Contact your emergency contact person',
        'Come immediately - do not delay'
      ],
      telemedicine: [
        'Test your internet connection and camera',
        'Find a quiet, private space',
        'Have good lighting for the video call',
        'Prepare your device 10 minutes early'
      ]
    };

    return instructions[appointmentType] || instructions.general_consultation;
  }

  /**
   * Smart cost calculation with insurance consideration
   */
  async calculateCost(provider, appointmentData) {
    const baseCost = provider.servicesOffered.find(
      service => service.service === appointmentData.type
    )?.cost || 450; // Default consultation fee

    let totalCost = baseCost;

    // Add procedure costs if applicable
    if (appointmentData.procedures) {
      const procedureCosts = appointmentData.procedures.map(proc => ({
        name: proc,
        cost: this.getProcedureCost(proc)
      }));
      totalCost += procedureCosts.reduce((sum, proc) => sum + proc.cost, 0);
    }

    // Apply insurance discounts if applicable
    if (appointmentData.insurance) {
      const discount = await this.calculateInsuranceDiscount(
        appointmentData.insurance,
        totalCost
      );
      totalCost -= discount;
    }

    return {
      consultation: baseCost,
      procedures: appointmentData.procedures?.map(proc => ({
        name: proc,
        cost: this.getProcedureCost(proc)
      })) || [],
      total: Math.max(0, totalCost)
    };
  }

  /**
   * Automated reminder system
   */
  async scheduleReminder(appointment, type, hoursBeforeAppointment) {
    const reminderTime = new Date(appointment.fullDateTime);
    reminderTime.setHours(reminderTime.getHours() - hoursBeforeAppointment);

    // In production, this would use a job scheduler like Bull or Agenda
    setTimeout(async () => {
      await this.sendReminder(appointment, type);
    }, reminderTime.getTime() - Date.now());

    logger.info('Reminder scheduled', {
      appointmentId: appointment._id,
      type,
      reminderTime
    });
  }

  /**
   * Send appointment reminders via multiple channels
   */
  async sendReminder(appointment, type) {
    try {
      const messages = {
        confirmation: `✅ Appointment confirmed with ${appointment.providerName} on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime.start}. Queue position: ${appointment.queuePosition}. Reply CANCEL to cancel.`,
        reminder_24h: `📅 Reminder: You have an appointment tomorrow with ${appointment.providerName} at ${appointment.appointmentTime.start}. Location: ${appointment.facilityName}. Estimated wait: ${appointment.estimatedWaitTime} min.`,
        reminder_2h: `⏰ Your appointment with ${appointment.providerName} is in 2 hours. Please arrive 15 minutes early. Current queue position: ${appointment.queuePosition}.`
      };

      const message = messages[type];
      if (!message) return;

      // Send SMS
      if (appointment.patientPhone) {
        await sendSMS(appointment.patientPhone, message);
        appointment.remindersSent.push({
          type: 'sms',
          sentAt: new Date(),
          status: 'sent'
        });
      }

      // Send email if available
      if (appointment.patientEmail) {
        await sendEmail(
          appointment.patientEmail,
          `Appointment ${type.replace('_', ' ')}`,
          message
        );
        appointment.remindersSent.push({
          type: 'email',
          sentAt: new Date(),
          status: 'sent'
        });
      }

      await appointment.save();

      logger.info('Reminder sent successfully', {
        appointmentId: appointment._id,
        type,
        channels: ['sms', 'email']
      });

    } catch (error) {
      logger.error('Failed to send reminder:', error);
    }
  }

  /**
   * Real-time queue position updates
   */
  async updateQueuePosition(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return;

      const newPosition = await this.calculateQueuePosition(
        appointment.providerId,
        appointment.appointmentDate
      );

      if (newPosition !== appointment.queuePosition) {
        appointment.queuePosition = newPosition;
        appointment.estimatedWaitTime = await this.calculateWaitTime(
          appointment.providerId,
          appointment.appointmentDate
        );

        await appointment.save();

        // Notify patient of queue position change
        if (newPosition < appointment.queuePosition) {
          await this.sendQueueUpdateNotification(appointment);
        }
      }

    } catch (error) {
      logger.error('Error updating queue position:', error);
    }
  }

  /**
   * Intelligent appointment rescheduling
   */
  async rescheduleAppointment(appointmentId, newDate, newTime, reason) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (!appointment.canReschedule()) {
        throw new Error('Appointment cannot be rescheduled at this time');
      }

      // Store original appointment details
      const originalDate = appointment.appointmentDate;
      const originalTime = appointment.appointmentTime;

      // Update appointment
      appointment.appointmentDate = newDate;
      appointment.appointmentTime = newTime;
      appointment.status = 'rescheduled';
      appointment.queuePosition = await this.calculateQueuePosition(
        appointment.providerId,
        newDate
      );

      // Add to rescheduling history
      appointment.reschedulingHistory.push({
        originalDate,
        originalTime,
        newDate,
        newTime,
        reason,
        rescheduledBy: 'patient'
      });

      await appointment.save();

      // Send confirmation of rescheduling
      await this.sendReschedulingConfirmation(appointment);

      logger.info('Appointment rescheduled successfully', {
        appointmentId,
        originalDate,
        newDate
      });

      return appointment;

    } catch (error) {
      logger.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  // Helper methods
  determineInitialStatus(appointmentData) {
    if (appointmentData.priority === 'emergency') return 'confirmed';
    if (appointmentData.priority === 'urgent') return 'confirmed';
    return 'requested';
  }

  detectAppointmentType(symptoms) {
    // Simple symptom-to-type mapping
    const typeMapping = {
      'anxiety|depression|stress|mental': 'mental_health_therapy',
      'emergency|urgent|severe|critical': 'emergency_consultation',
      'follow.?up|check.?up': 'follow_up',
      'heart|chest|cardiac': 'specialist_consultation'
    };

    for (const [pattern, type] of Object.entries(typeMapping)) {
      if (new RegExp(pattern, 'i').test(symptoms)) {
        return type;
      }
    }

    return 'general_consultation';
  }

  getStandardDuration(type) {
    const durations = {
      general_consultation: 30,
      specialist_consultation: 45,
      mental_health_therapy: 60,
      follow_up: 20,
      emergency_consultation: 15,
      telemedicine: 30
    };

    return durations[type] || 30;
  }

  calculatePriority(symptoms, urgency) {
    if (urgency === 'emergency') return 'emergency';
    if (urgency === 'urgent') return 'urgent';
    
    // Analyze symptoms for priority
    const highPrioritySymptoms = /chest.?pain|difficulty.?breathing|severe.?pain|bleeding|unconscious/i;
    if (symptoms && highPrioritySymptoms.test(symptoms)) {
      return 'high';
    }

    return 'normal';
  }
}

// Singleton instance
const appointmentBookingService = new AppointmentBookingService();

export { appointmentBookingService };
export default appointmentBookingService;
