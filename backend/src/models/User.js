import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      required: true
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    profilePicture: {
      type: String,
      default: null
    }
  },

  // Health Information (Encrypted)
  healthProfile: {
    // Medical conditions
    conditions: [{
      name: String,
      diagnosedDate: Date,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      notes: String
    }],
    
    // Medications
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
      prescribedBy: String
    }],
    
    // Allergies
    allergies: [{
      allergen: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life_threatening']
      },
      reaction: String
    }],
    
    // Emergency contacts
    emergencyContacts: [{
      name: String,
      relationship: String,
      phoneNumber: String,
      email: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    
    // Healthcare providers
    healthcareProviders: [{
      name: String,
      specialty: String,
      phoneNumber: String,
      email: String,
      address: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    
    // Insurance information (encrypted)
    insurance: {
      provider: String,
      policyNumber: String, // This will be encrypted
      groupNumber: String,
      memberID: String // This will be encrypted
    }
  },

  // App Settings
  settings: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'af', 'zu', 'xh'] // English, Afrikaans, Zulu, Xhosa
    },
    notifications: {
      push: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      medication: {
        type: Boolean,
        default: true
      },
      appointment: {
        type: Boolean,
        default: true
      },
      emergency: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      shareDataWithProviders: {
        type: Boolean,
        default: false
      },
      allowResearch: {
        type: Boolean,
        default: false
      },
      dataRetention: {
        type: String,
        enum: ['1year', '2years', '5years', '7years'],
        default: '7years'
      }
    }
  },

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'wellness', 'family'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    paymentMethod: String,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  },

  // Security
  security: {
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String
  },

  // Audit Trail
  audit: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastHealthDataUpdate: Date,
    dataAccessLog: [{
      accessedBy: String,
      accessType: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      ipAddress: String
    }]
  },

  // Soft delete
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and security
userSchema.index({ email: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'audit.createdAt': 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for age
userSchema.virtual('profile.age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.audit.updatedAt = new Date();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.security.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

// Static method to handle failed login attempts
userSchema.statics.handleFailedLogin = async function(email) {
  const user = await this.findOne({ email });
  if (!user) return;
  
  user.security.loginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (user.security.loginAttempts >= 5) {
    user.security.lockUntil = Date.now() + 30 * 60 * 1000;
  }
  
  await user.save();
};

// Static method to handle successful login
userSchema.statics.handleSuccessfulLogin = async function(email) {
  const user = await this.findOne({ email });
  if (!user) return;
  
  user.security.loginAttempts = 0;
  user.security.lockUntil = undefined;
  user.security.lastLogin = new Date();
  
  await user.save();
};

const User = mongoose.model('User', userSchema);

export default User;
