import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/users/profile
 * Get user profile
 */
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        subscription: user.subscription,
        settings: user.settings
      }
    });
    
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

export default router;
