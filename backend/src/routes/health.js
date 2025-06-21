import express from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/health/profile
 * Get user's health profile
 */
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        healthProfile: user.healthProfile,
        lastUpdate: user.audit.lastHealthDataUpdate
      }
    });
    
  } catch (error) {
    logger.error('Error fetching health profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health profile'
    });
  }
});

/**
 * PUT /api/v1/health/profile
 * Update user's health profile
 */
router.put('/profile', async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;
    
    // Update health profile
    if (updates.conditions) user.healthProfile.conditions = updates.conditions;
    if (updates.medications) user.healthProfile.medications = updates.medications;
    if (updates.allergies) user.healthProfile.allergies = updates.allergies;
    if (updates.emergencyContacts) user.healthProfile.emergencyContacts = updates.emergencyContacts;
    
    user.audit.lastHealthDataUpdate = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      data: user.healthProfile
    });
    
  } catch (error) {
    logger.error('Error updating health profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update health profile'
    });
  }
});

export default router;
