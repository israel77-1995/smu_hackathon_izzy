import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Basic appointment information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Patient information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  patientName: {
    type: String,
    required: true,
    trim: true
  },

  patientPhone: {
    type: String,
    required: true,
    trim: true
  },

  patientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Healthcare provider information
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthcareProvider',
    required: true,
    index: true
  },

  providerName: {
    type: String,
    required: true,
    trim: true
  },

  facilityName: {
    type: String,
    required: true,
    trim: true
  },

  facilityAddress: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Appointment scheduling
  appointmentDate: {
    type: Date,
    required: true,
    index: true
  },

  appointmentTime: {
    start: {
      type: String,
      required: true // Format: "HH:MM"
    },
    end: {
      type: String,
      required: true // Format: "HH:MM"
    }
  },

  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 240 // Duration in minutes
  },

  // Appointment type and category
  type: {
    type: String,
    required: true,
    enum: [
      'general_consultation',
      'specialist_consultation', 
      'mental_health_therapy',
      'follow_up',
      'emergency_consultation',
      'telemedicine',
      'mobile_clinic',
      'vaccination',
      'health_screening',
      'chronic_care_management'
    ]
  },

  specialty: {
    type: String,
    enum: [
      'general_medicine',
      'cardiology',
      'dermatology',
      'endocrinology',
      'gastroenterology',
      'neurology',
      'oncology',
      'orthopedics',
      'pediatrics',
      'psychiatry',
      'psychology',
      'pulmonology',
      'urology',
      'gynecology',
      'ophthalmology',
      'ent',
      'emergency_medicine'
    ]
  },

  // Appointment status and management
  status: {
    type: String,
    required: true,
    enum: [
      'requested',
      'confirmed',
      'rescheduled',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'waiting'
    ],
    default: 'requested',
    index: true
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent', 'emergency'],
    default: 'normal'
  },

  // Queue management
  queuePosition: {
    type: Number,
    min: 0
  },

  estimatedWaitTime: {
    type: Number, // Minutes
    min: 0
  },

  checkInTime: {
    type: Date
  },

  // Automated features
  remindersSent: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'ussd', 'push_notification']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],

  autoReschedulingEnabled: {
    type: Boolean,
    default: true
  },

  // Preparation and requirements
  preparationInstructions: [{
    instruction: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],

  requiredDocuments: [{
    document: String,
    uploaded: {
      type: Boolean,
      default: false
    },
    uploadedAt: Date
  }],

  // Financial information
  cost: {
    consultation: {
      type: Number,
      min: 0
    },
    procedures: [{
      name: String,
      cost: Number
    }],
    total: {
      type: Number,
      min: 0
    }
  },

  insurance: {
    provider: String,
    policyNumber: String,
    coverageVerified: {
      type: Boolean,
      default: false
    },
    copayAmount: Number
  },

  // Health and safety
  covidScreening: {
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    symptoms: [String],
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  },

  // Follow-up and continuity
  followUpRequired: {
    type: Boolean,
    default: false
  },

  followUpDate: Date,

  relatedAppointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],

  // Notes and communication
  patientNotes: {
    type: String,
    maxlength: 2000
  },

  providerNotes: {
    type: String,
    maxlength: 2000
  },

  internalNotes: {
    type: String,
    maxlength: 1000
  },

  // Telemedicine specific
  telemedicine: {
    platform: {
      type: String,
      enum: ['zoom', 'teams', 'webex', 'custom']
    },
    meetingLink: String,
    meetingId: String,
    password: String,
    technicalRequirements: [String]
  },

  // Cancellation and rescheduling
  cancellationReason: String,
  
  reschedulingHistory: [{
    originalDate: Date,
    originalTime: {
      start: String,
      end: String
    },
    newDate: Date,
    newTime: {
      start: String,
      end: String
    },
    reason: String,
    rescheduledAt: {
      type: Date,
      default: Date.now
    },
    rescheduledBy: {
      type: String,
      enum: ['patient', 'provider', 'system']
    }
  }],

  // System metadata
  createdBy: {
    type: String,
    enum: ['patient', 'provider', 'admin', 'system'],
    default: 'patient'
  },

  source: {
    type: String,
    enum: ['mobile_app', 'web_app', 'ussd', 'phone_call', 'walk_in'],
    default: 'mobile_app'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ providerId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ facilityName: 1, appointmentDate: 1 });
appointmentSchema.index({ type: 1, specialty: 1 });

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual for full appointment datetime
appointmentSchema.virtual('fullDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.start.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Virtual for appointment end datetime
appointmentSchema.virtual('endDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.end.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Pre-save middleware
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total cost
  if (this.cost && this.cost.consultation) {
    let total = this.cost.consultation;
    if (this.cost.procedures && this.cost.procedures.length > 0) {
      total += this.cost.procedures.reduce((sum, proc) => sum + (proc.cost || 0), 0);
    }
    this.cost.total = total;
  }
  
  next();
});

// Static methods
appointmentSchema.statics.findUpcoming = function(patientId, days = 30) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    patientId,
    appointmentDate: { $gte: startDate, $lte: endDate },
    status: { $in: ['confirmed', 'rescheduled'] }
  }).sort({ appointmentDate: 1 });
};

appointmentSchema.statics.findByProvider = function(providerId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  return this.find({
    providerId,
    appointmentDate: { $gte: startDate, $lt: endDate },
    status: { $ne: 'cancelled' }
  }).sort({ 'appointmentTime.start': 1 });
};

// Instance methods
appointmentSchema.methods.canReschedule = function() {
  const now = new Date();
  const appointmentDateTime = this.fullDateTime;
  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment > 24 && ['confirmed', 'rescheduled'].includes(this.status);
};

appointmentSchema.methods.canCancel = function() {
  const now = new Date();
  const appointmentDateTime = this.fullDateTime;
  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment > 2 && ['confirmed', 'rescheduled'].includes(this.status);
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
