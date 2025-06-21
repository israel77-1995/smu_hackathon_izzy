import express from 'express';
import Appointment from '../models/Appointment.js';
import HealthcareProvider from '../models/HealthcareProvider.js';
import appointmentBookingService from '../services/appointmentBooking.js';
import { logger } from '../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

/**
 * Book a new appointment
 * POST /api/v1/appointments/book
 */
router.post('/book', [
  body('type').isIn([
    'general_consultation',
    'specialist_consultation',
    'mental_health_therapy',
    'follow_up',
    'emergency_consultation',
    'telemedicine',
    'mobile_clinic',
    'vaccination',
    'health_screening'
  ]).withMessage('Invalid appointment type'),
  body('appointmentDate').isISO8601().withMessage('Invalid appointment date'),
  body('patientName').trim().isLength({ min: 2, max: 100 }).withMessage('Patient name required'),
  body('patientPhone').isMobilePhone().withMessage('Valid phone number required'),
  body('patientEmail').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // For demo purposes, create mock appointment data
    const mockAppointment = {
      id: 'apt_' + Date.now(),
      title: req.body.title || 'Health Consultation',
      appointmentDate: new Date(req.body.appointmentDate),
      appointmentTime: {
        start: req.body.preferredTime || '10:00',
        end: req.body.preferredTime ?
          (parseInt(req.body.preferredTime.split(':')[0]) + 1) + ':' + req.body.preferredTime.split(':')[1]
          : '11:00'
      },
      patientName: req.body.patientName,
      patientPhone: req.body.patientPhone,
      patientEmail: req.body.patientEmail,
      type: req.body.type,
      status: 'confirmed',
      queuePosition: Math.floor(Math.random() * 5) + 1,
      estimatedWaitTime: Math.floor(Math.random() * 30) + 15,
      providerName: 'Dr. Sarah Johnson',
      facilityName: 'Cape Town Medical Centre',
      facilityAddress: {
        street: '123 Health Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001'
      },
      cost: {
        consultation: 450,
        total: 450
      },
      preparationInstructions: [
        'Bring your ID document and medical aid card',
        'List all current medications you are taking',
        'Arrive 15 minutes early for check-in',
        'Prepare questions you want to ask the doctor'
      ]
    };

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully! 🎉',
      data: {
        appointment: mockAppointment,
        provider: {
          name: 'Dr. Sarah Johnson',
          facility: 'Cape Town Medical Centre',
          rating: 4.8,
          specialty: 'General Medicine'
        },
        queueInfo: {
          position: mockAppointment.queuePosition,
          estimatedWaitTime: mockAppointment.estimatedWaitTime,
          message: `You are #${mockAppointment.queuePosition} in the queue. Estimated wait time: ${mockAppointment.estimatedWaitTime} minutes.`
        },
        preparationInstructions: mockAppointment.preparationInstructions,
        nextSteps: [
          'You will receive SMS and email confirmations',
          'Reminders will be sent 24 hours and 2 hours before your appointment',
          'You can track your queue position in real-time',
          'Reschedule or cancel up to 24 hours before your appointment'
        ]
      }
    });

  } catch (error) {
    logger.error('Appointment booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book appointment'
    });
  }
});

/**
 * Get user's appointments
 * GET /api/v1/appointments
 */
router.get('/', [
  query('status').optional().isIn(['all', 'upcoming', 'past', 'cancelled']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const { status = 'upcoming', limit = 10, page = 1 } = req.query;

    // Mock appointments data for demo
    const mockAppointments = [
      {
        id: 'apt_001',
        title: 'General Health Checkup',
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        appointmentTime: { start: '10:00', end: '11:00' },
        providerName: 'Dr. Sarah Johnson',
        facilityName: 'Cape Town Medical Centre',
        type: 'general_consultation',
        status: 'confirmed',
        queuePosition: 3,
        estimatedWaitTime: 25,
        cost: { total: 450 }
      },
      {
        id: 'apt_002',
        title: 'Mental Health Therapy',
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        appointmentTime: { start: '14:00', end: '15:00' },
        providerName: 'Dr. Michael Chen',
        facilityName: 'Wellness Psychology Centre',
        type: 'mental_health_therapy',
        status: 'confirmed',
        queuePosition: 1,
        estimatedWaitTime: 10,
        cost: { total: 650 }
      },
      {
        id: 'apt_003',
        title: 'Follow-up Consultation',
        appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        appointmentTime: { start: '09:00', end: '09:30' },
        providerName: 'Dr. Emily Carter',
        facilityName: 'Family Health Clinic',
        type: 'follow_up',
        status: 'completed',
        cost: { total: 300 }
      }
    ];

    // Filter based on status
    let filteredAppointments = mockAppointments;
    const now = new Date();

    switch (status) {
      case 'upcoming':
        filteredAppointments = mockAppointments.filter(apt =>
          new Date(apt.appointmentDate) >= now && apt.status !== 'cancelled'
        );
        break;
      case 'past':
        filteredAppointments = mockAppointments.filter(apt =>
          new Date(apt.appointmentDate) < now || apt.status === 'completed'
        );
        break;
      case 'cancelled':
        filteredAppointments = mockAppointments.filter(apt => apt.status === 'cancelled');
        break;
      // 'all' - no additional filters
    }

    res.json({
      success: true,
      data: {
        appointments: filteredAppointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredAppointments.length,
          pages: Math.ceil(filteredAppointments.length / parseInt(limit))
        },
        summary: {
          upcoming: mockAppointments.filter(apt =>
            new Date(apt.appointmentDate) >= now && apt.status !== 'cancelled'
          ).length,
          past: mockAppointments.filter(apt =>
            new Date(apt.appointmentDate) < now || apt.status === 'completed'
          ).length,
          cancelled: mockAppointments.filter(apt => apt.status === 'cancelled').length
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
});

/**
 * Get appointment details
 * GET /api/v1/appointments/:id
 */
router.get('/:id', [
  param('id').notEmpty().withMessage('Appointment ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Mock appointment details
    const mockAppointment = {
      id: req.params.id,
      title: 'General Health Checkup',
      description: 'Routine health examination and consultation',
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      appointmentTime: { start: '10:00', end: '11:00' },
      duration: 60,
      patientName: 'John Doe',
      patientPhone: '+27123456789',
      patientEmail: 'john.doe@email.com',
      providerName: 'Dr. Sarah Johnson',
      facilityName: 'Cape Town Medical Centre',
      facilityAddress: {
        street: '123 Health Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        coordinates: { latitude: -33.9249, longitude: 18.4241 }
      },
      type: 'general_consultation',
      specialty: 'general_medicine',
      status: 'confirmed',
      priority: 'normal',
      queuePosition: 3,
      estimatedWaitTime: 25,
      cost: {
        consultation: 450,
        procedures: [],
        total: 450
      },
      preparationInstructions: [
        { instruction: 'Bring your ID document and medical aid card', completed: false },
        { instruction: 'List all current medications you are taking', completed: false },
        { instruction: 'Arrive 15 minutes early for check-in', completed: false },
        { instruction: 'Prepare questions you want to ask the doctor', completed: false }
      ],
      remindersSent: [
        { type: 'sms', sentAt: new Date(Date.now() - 60 * 60 * 1000), status: 'delivered' }
      ],
      provider: {
        name: 'Dr. Sarah Johnson',
        title: 'Dr.',
        rating: { average: 4.8, totalReviews: 156 },
        contactInfo: {
          primaryPhone: '+27214567890',
          email: 'dr.johnson@ctmc.co.za'
        },
        languages: ['english', 'afrikaans'],
        yearsOfExperience: 12
      }
    };

    res.json({
      success: true,
      data: { appointment: mockAppointment }
    });

  } catch (error) {
    logger.error('Error fetching appointment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment details'
    });
  }
});

/**
 * Get available time slots
 * GET /api/v1/appointments/availability
 */
router.get('/availability/slots', [
  query('date').isISO8601().withMessage('Invalid date'),
  query('specialty').optional().isIn([
    'general_medicine', 'cardiology', 'dermatology', 'psychiatry', 'psychology'
  ]).withMessage('Invalid specialty'),
  query('city').optional().trim().isLength({ min: 2 }).withMessage('Invalid city')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { date, specialty = 'general_medicine', city = 'Cape Town' } = req.query;

    // Mock availability data
    const mockAvailability = [
      {
        provider: {
          id: 'prov_001',
          name: 'Dr. Sarah Johnson',
          facility: 'Cape Town Medical Centre',
          rating: 4.8,
          specialty: 'general_medicine',
          address: '123 Health Street, Cape Town',
          distance: '2.3 km'
        },
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      },
      {
        provider: {
          id: 'prov_002',
          name: 'Dr. Michael Chen',
          facility: 'Wellness Medical Centre',
          rating: 4.6,
          specialty: 'general_medicine',
          address: '456 Wellness Ave, Cape Town',
          distance: '3.1 km'
        },
        availableSlots: ['08:00', '09:30', '11:30', '13:00', '15:30']
      },
      {
        provider: {
          id: 'prov_003',
          name: 'Dr. Emily Carter',
          facility: 'Family Health Clinic',
          rating: 4.9,
          specialty: 'general_medicine',
          address: '789 Family St, Cape Town',
          distance: '1.8 km'
        },
        availableSlots: ['10:30', '12:00', '14:30', '16:30']
      }
    ];

    res.json({
      success: true,
      data: {
        availability: mockAvailability,
        searchCriteria: {
          date,
          specialty,
          city
        },
        totalProviders: mockAvailability.length,
        totalSlots: mockAvailability.reduce((sum, prov) => sum + prov.availableSlots.length, 0)
      }
    });

  } catch (error) {
    logger.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability'
    });
  }
});

/**
 * Get queue status
 * GET /api/v1/appointments/:id/queue
 */
router.get('/:id/queue', [
  param('id').notEmpty().withMessage('Appointment ID required')
], async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Mock real-time queue data
    const mockQueueData = {
      queuePosition: Math.max(1, Math.floor(Math.random() * 5)),
      estimatedWaitTime: Math.floor(Math.random() * 30) + 10,
      status: 'confirmed',
      appointmentTime: { start: '10:00', end: '11:00' },
      currentTime: new Date().toISOString(),
      queueMovement: {
        lastUpdate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        positionChange: -1, // Moved up 1 position
        timeReduction: 5 // 5 minutes less wait time
      },
      facilityStatus: {
        currentlyServing: 'Patient #2',
        averageConsultationTime: 25,
        runningOnTime: true,
        delayMinutes: 0
      }
    };

    res.json({
      success: true,
      data: mockQueueData,
      message: mockQueueData.queuePosition === 1 ?
        'You\'re next! Please prepare to be called.' :
        `You are #${mockQueueData.queuePosition} in the queue. Estimated wait: ${mockQueueData.estimatedWaitTime} minutes.`
    });

  } catch (error) {
    logger.error('Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue status'
    });
  }
});

/**
 * Reschedule appointment
 * PUT /api/v1/appointments/:id/reschedule
 */
router.put('/:id/reschedule', [
  param('id').notEmpty().withMessage('Appointment ID required'),
  body('newDate').isISO8601().withMessage('Invalid new date'),
  body('newTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { newDate, newTime, reason } = req.body;

    // Mock rescheduled appointment
    const rescheduledAppointment = {
      id: req.params.id,
      title: 'General Health Checkup',
      appointmentDate: new Date(newDate),
      appointmentTime: {
        start: newTime,
        end: (parseInt(newTime.split(':')[0]) + 1) + ':' + newTime.split(':')[1]
      },
      status: 'rescheduled',
      queuePosition: Math.floor(Math.random() * 3) + 1,
      estimatedWaitTime: Math.floor(Math.random() * 20) + 15,
      reschedulingHistory: [{
        originalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        originalTime: { start: '10:00', end: '11:00' },
        newDate: new Date(newDate),
        newTime: { start: newTime, end: (parseInt(newTime.split(':')[0]) + 1) + ':' + newTime.split(':')[1] },
        reason: reason || 'Patient requested reschedule',
        rescheduledAt: new Date(),
        rescheduledBy: 'patient'
      }]
    };

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully! 📅',
      data: {
        appointment: rescheduledAppointment,
        confirmationMessage: `Your appointment has been moved to ${new Date(newDate).toDateString()} at ${newTime}. You will receive confirmation via SMS and email.`,
        nextSteps: [
          'New confirmation SMS and email will be sent',
          'Updated reminders will be scheduled',
          'Your queue position has been updated'
        ]
      }
    });

  } catch (error) {
    logger.error('Error rescheduling appointment:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reschedule appointment'
    });
  }
});

/**
 * Cancel appointment
 * PUT /api/v1/appointments/:id/cancel
 */
router.put('/:id/cancel', [
  param('id').notEmpty().withMessage('Appointment ID required'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { reason } = req.body;

    // Mock cancelled appointment
    const cancelledAppointment = {
      id: req.params.id,
      title: 'General Health Checkup',
      status: 'cancelled',
      cancellationReason: reason || 'Patient requested cancellation',
      cancelledAt: new Date(),
      refundInfo: {
        eligible: true,
        amount: 450,
        processingTime: '3-5 business days',
        method: 'Original payment method'
      }
    };

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment: cancelledAppointment,
        confirmationMessage: 'Your appointment has been cancelled. A confirmation has been sent to your email and SMS.',
        refundInfo: cancelledAppointment.refundInfo,
        rebookingOptions: {
          available: true,
          message: 'You can book a new appointment anytime through the app',
          suggestedDates: [
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          ]
        }
      }
    });

  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

export default router;
