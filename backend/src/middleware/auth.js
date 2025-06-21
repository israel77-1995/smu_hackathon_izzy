import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger, healthDataLogger } from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or inactive.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    // Log access for audit
    healthDataLogger.logHealthDataAccess(
      user._id,
      'api_access',
      req.route?.path || req.path,
      'user',
      req.ip
    );

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication for optional middleware
    next();
  }
};
