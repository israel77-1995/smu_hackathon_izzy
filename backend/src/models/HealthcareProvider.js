import mongoose from 'mongoose';

const healthcareProviderSchema = new mongoose.Schema({
  // Basic provider information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  // Professional credentials
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    verified: {
      type: Boolean,
      default: false
    }
  }],

  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  licenseExpiry: {
    type: Date,
    required: true
  },

  // Specialties and services
  primarySpecialty: {
    type: String,
    required: true,
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

  secondarySpecialties: [{
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
  }],

  servicesOffered: [{
    service: String,
    description: String,
    duration: Number, // minutes
    cost: Number
  }],

  // Practice information
  practiceType: {
    type: String,
    enum: ['private', 'public', 'ngo', 'mobile_clinic'],
    required: true
  },

  facilities: [{
    name: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    phone: String,
    email: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // Availability and scheduling
  workingHours: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    },
    startTime: String, // "HH:MM"
    endTime: String,   // "HH:MM"
    facilityId: mongoose.Schema.Types.ObjectId
  }],

  appointmentDuration: {
    default: {
      type: Number,
      default: 30 // minutes
    },
    consultation: Number,
    followUp: Number,
    emergency: Number
  },

  // Availability settings
  bookingSettings: {
    advanceBookingDays: {
      type: Number,
      default: 30
    },
    minimumNoticeHours: {
      type: Number,
      default: 24
    },
    allowSameDayBooking: {
      type: Boolean,
      default: false
    },
    allowWeekendBooking: {
      type: Boolean,
      default: false
    },
    maxAppointmentsPerDay: {
      type: Number,
      default: 20
    }
  },

  // Contact information
  contactInfo: {
    primaryPhone: {
      type: String,
      required: true
    },
    secondaryPhone: String,
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    website: String,
    emergencyContact: String
  },

  // Languages spoken
  languages: [{
    type: String,
    enum: ['english', 'afrikaans', 'isizulu', 'sesotho', 'isixhosa', 'setswana', 'sepedi', 'xitsonga', 'siswati', 'tshivenda', 'isindebele']
  }],

  // Professional profile
  biography: {
    type: String,
    maxlength: 2000
  },

  yearsOfExperience: {
    type: Number,
    min: 0
  },

  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number
  }],

  // Ratings and reviews
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    breakdown: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },

  // Insurance and payments
  acceptedInsurance: [{
    provider: String,
    plans: [String]
  }],

  paymentMethods: [{
    type: String,
    enum: ['cash', 'card', 'eft', 'medical_aid', 'government']
  }],

  // Telemedicine capabilities
  telemedicine: {
    enabled: {
      type: Boolean,
      default: false
    },
    platforms: [{
      type: String,
      enum: ['zoom', 'teams', 'webex', 'custom']
    }],
    consultationFee: Number,
    technicalRequirements: [String]
  },

  // Emergency and after-hours
  emergencyServices: {
    available: {
      type: Boolean,
      default: false
    },
    afterHoursContact: String,
    emergencyFee: Number
  },

  // Status and verification
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },

  verified: {
    type: Boolean,
    default: false
  },

  verificationDate: Date,

  // System metadata
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  lastActiveAt: Date,

  // Statistics
  statistics: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    cancelledAppointments: {
      type: Number,
      default: 0
    },
    noShowRate: {
      type: Number,
      default: 0
    },
    averageWaitTime: {
      type: Number,
      default: 0
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
healthcareProviderSchema.index({ primarySpecialty: 1, status: 1 });
healthcareProviderSchema.index({ 'facilities.address.city': 1, primarySpecialty: 1 });
healthcareProviderSchema.index({ 'rating.average': -1 });
healthcareProviderSchema.index({ licenseNumber: 1 });
healthcareProviderSchema.index({ status: 1, verified: 1 });

// Virtual for full name with title
healthcareProviderSchema.virtual('fullName').get(function() {
  return `${this.title} ${this.name}`;
});

// Virtual for primary facility
healthcareProviderSchema.virtual('primaryFacility').get(function() {
  return this.facilities.find(facility => facility.isPrimary) || this.facilities[0];
});

// Static methods
healthcareProviderSchema.statics.findBySpecialty = function(specialty, city = null) {
  const query = {
    $or: [
      { primarySpecialty: specialty },
      { secondarySpecialties: specialty }
    ],
    status: 'active',
    verified: true
  };

  if (city) {
    query['facilities.address.city'] = new RegExp(city, 'i');
  }

  return this.find(query).sort({ 'rating.average': -1 });
};

healthcareProviderSchema.statics.findAvailable = function(date, specialty = null) {
  const dayOfWeek = new Date(date).getDay();
  
  const query = {
    status: 'active',
    verified: true,
    'workingHours.dayOfWeek': dayOfWeek
  };

  if (specialty) {
    query.$or = [
      { primarySpecialty: specialty },
      { secondarySpecialties: specialty }
    ];
  }

  return this.find(query).sort({ 'rating.average': -1 });
};

// Instance methods
healthcareProviderSchema.methods.isAvailable = function(date, time) {
  const dayOfWeek = new Date(date).getDay();
  const workingDay = this.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
  
  if (!workingDay) return false;
  
  const appointmentTime = time.replace(':', '');
  const startTime = workingDay.startTime.replace(':', '');
  const endTime = workingDay.endTime.replace(':', '');
  
  return appointmentTime >= startTime && appointmentTime <= endTime;
};

healthcareProviderSchema.methods.getAvailableSlots = function(date) {
  const dayOfWeek = new Date(date).getDay();
  const workingDay = this.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
  
  if (!workingDay) return [];
  
  const slots = [];
  const duration = this.appointmentDuration.default;
  const [startHour, startMinute] = workingDay.startTime.split(':').map(Number);
  const [endHour, endMinute] = workingDay.endTime.split(':').map(Number);
  
  let currentTime = new Date();
  currentTime.setHours(startHour, startMinute, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);
  
  while (currentTime < endTime) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    slots.push(timeString);
    currentTime.setMinutes(currentTime.getMinutes() + duration);
  }
  
  return slots;
};

const HealthcareProvider = mongoose.model('HealthcareProvider', healthcareProviderSchema);

export default HealthcareProvider;
