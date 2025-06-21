import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/appointments
 * Get user's appointments
 */
router.get('/', async (req, res) => {
  try {
    // Mock appointments for now
    const appointments = [
      {
        id: '1',
        title: 'Mobile Clinic',
        date: new Date(),
        time: '2:00 PM - 3:00 PM',
        provider: 'Dr Emily Carter',
        type: 'general_checkup',
        status: 'confirmed'
      }
    ];
    
    res.status(200).json({
      success: true,
      data: appointments
    });
    
  } catch (error) {
    logger.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
});

export default router;
