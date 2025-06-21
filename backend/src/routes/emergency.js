import express from 'express';
import { getEmergencyResources } from '../services/emergencyService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/emergency/resources
 * Get emergency resources and contact information
 */
router.get('/resources', async (req, res) => {
  try {
    const resources = getEmergencyResources();
    
    res.status(200).json({
      success: true,
      data: resources
    });
    
  } catch (error) {
    logger.error('Error fetching emergency resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency resources'
    });
  }
});

export default router;
