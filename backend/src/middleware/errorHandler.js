import { logger, errorLogger } from '../utils/logger.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  errorLogger.logApplicationError(err, {
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  }, req.userId);

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(error);
  }

  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    return res.status(400).json(error);
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value';
    return res.status(409).json(error);
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  // Default 500 error
  res.status(err.statusCode || 500).json(error);
};
