import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_here';
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive health data
 */
export const encrypt = (text) => {
  try {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('health-data', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive health data
 */
export const decrypt = (encryptedData) => {
  try {
    if (!encryptedData || !encryptedData.encrypted) return null;
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('health-data', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Middleware to encrypt health data in requests
 */
export const healthDataEncryption = (req, res, next) => {
  // This middleware would encrypt sensitive fields in the request body
  // For now, we'll just pass through
  next();
};

/**
 * Hash sensitive identifiers (one-way)
 */
export const hashIdentifier = (identifier) => {
  return crypto.createHash('sha256').update(identifier).digest('hex');
};
