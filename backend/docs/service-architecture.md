# Backend Service Architecture

## 🏗️ Service Layer Overview

The backend follows a layered architecture with clear separation of concerns:

```
┌─────────────────┐
│   Controllers   │ ← Route handlers, request/response
├─────────────────┤
│    Services     │ ← Business logic, core functionality
├─────────────────┤
│   Data Access   │ ← Database operations, models
├─────────────────┤
│   External      │ ← Third-party integrations
└─────────────────┘
```

## 🤖 Medical AI Service

### Core Functionality
**File**: `src/services/medicalAI.js`

```javascript
class MedicalAIService {
  constructor() {
    this.isInitialized = false;
    this.medicalKeywords = new Set();
    this.emergencyKeywords = new Set();
    this.confidenceThreshold = 0.7;
  }

  async initialize() {
    await this.loadMedicalVocabulary();
    await this.loadEmergencyPatterns();
    await this.initializeLocalModel();
    this.isInitialized = true;
  }

  async processHealthQuery(message, conversationHistory, userProfile) {
    // Core medical AI processing logic
  }
}
```

### Key Features
- **Privacy-First Processing**: All analysis done locally
- **Medical Vocabulary**: Extensive symptom and condition database
- **Emergency Detection**: Multi-level crisis intervention
- **Topic Classification**: Automatic medical category assignment
- **Confidence Scoring**: Response reliability metrics

### Medical Topic Classification
```javascript
const MEDICAL_TOPICS = {
  PAIN_MANAGEMENT: 'pain_management',
  MENTAL_HEALTH: 'mental_health',
  ILLNESS: 'illness',
  MEDICATION: 'medication',
  SLEEP_HEALTH: 'sleep_health',
  GENERAL_HEALTH: 'general_health'
};

identifyMedicalTopics(message) {
  const topics = [];
  const lowerMessage = message.toLowerCase();
  
  if (this.containsPainKeywords(lowerMessage)) {
    topics.push(MEDICAL_TOPICS.PAIN_MANAGEMENT);
  }
  
  if (this.containsMentalHealthKeywords(lowerMessage)) {
    topics.push(MEDICAL_TOPICS.MENTAL_HEALTH);
  }
  
  return topics;
}
```

### Emergency Detection Algorithm
```javascript
detectEmergency(message) {
  const lowerMessage = message.toLowerCase();
  
  // Critical emergency keywords
  const criticalKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'overdose', 'hanging', 'jumping'
  ];
  
  // High priority keywords
  const highKeywords = [
    'hurt myself', 'self harm', 'cutting',
    'chest pain', 'can\'t breathe', 'heart attack'
  ];
  
  for (const keyword of criticalKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        isEmergency: true,
        level: 'critical',
        keyword,
        confidence: 0.95
      };
    }
  }
  
  // Continue with high and moderate checks...
}
```

## 🚨 Emergency Service

### Emergency Response System
**File**: `src/services/emergencyService.js`

```javascript
class EmergencyService {
  async handleEmergencyResponse(userId, message, emergencyLevel) {
    const response = {
      userId,
      emergencyLevel,
      timestamp: new Date().toISOString(),
      resources: this.getEmergencyResources(),
      actions: []
    };
    
    switch (emergencyLevel) {
      case 'critical':
        response.actions = await this.handleCriticalEmergency(userId, message);
        break;
      case 'high':
        response.actions = await this.handleHighEmergency(userId, message);
        break;
      case 'moderate':
        response.actions = await this.handleModerateEmergency(userId, message);
        break;
    }
    
    // Log emergency event
    await this.logEmergencyEvent(response);
    
    // Send real-time notification
    this.notifyEmergencyResponse(userId, response);
    
    return response;
  }
}
```

### South African Emergency Integration
```javascript
getEmergencyResources() {
  return {
    crisis: {
      name: 'Crisis Helpline',
      number: process.env.EMERGENCY_CRISIS_LINE || '0800567567',
      description: 'Free 24/7 mental health crisis support',
      available: '24/7'
    },
    suicide: {
      name: 'Suicide Prevention Lifeline',
      number: process.env.EMERGENCY_SUICIDE_PREVENTION || '0800121314',
      description: 'Immediate suicide prevention support',
      available: '24/7'
    },
    emergency: {
      name: 'Emergency Services',
      number: process.env.EMERGENCY_SERVICES || '10177',
      description: 'Police, ambulance, fire services',
      available: '24/7'
    },
    sms: {
      name: 'SMS Counseling',
      number: process.env.EMERGENCY_SMS || '31393',
      description: 'Text "Hi" for confidential support',
      available: '24/7'
    }
  };
}
```

## 💬 Conversation Service

### Conversation Management
**File**: `src/services/conversationService.js`

```javascript
// Conversation Schema
const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      confidence: Number,
      medicalTopics: [String],
      isEmergency: Boolean,
      emergencyLevel: String,
      recommendations: [String]
    }
  }],
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyLevel: {
    type: String,
    enum: ['none', 'moderate', 'high', 'critical'],
    default: 'none'
  }
});
```

### Message Processing Pipeline
```javascript
async saveConversation({ userId, conversationId, userMessage, aiResponse, metadata }) {
  let conversation;
  
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId });
  } else {
    conversation = new Conversation({ userId, messages: [] });
  }
  
  // Add user message
  conversation.messages.push({
    sender: 'user',
    content: userMessage,
    timestamp: new Date()
  });
  
  // Add AI response with metadata
  conversation.messages.push({
    sender: 'ai',
    content: aiResponse,
    timestamp: new Date(),
    metadata
  });
  
  // Update emergency status
  if (metadata.isEmergency) {
    conversation.isEmergency = true;
    conversation.emergencyLevel = metadata.emergencyLevel;
  }
  
  await conversation.save();
  return conversation;
}
```

## 🔐 Authentication Service

### JWT Token Management
**File**: `src/services/authService.js`

```javascript
class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }
      
      return user;
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }
}
```

### Password Security
```javascript
// Password hashing with bcrypt
async hashPassword(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
}

async comparePassword(candidatePassword, hashedPassword) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
}

// Account lockout mechanism
async handleFailedLogin(email) {
  const user = await User.findOne({ email });
  if (!user) return;
  
  user.security.loginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (user.security.loginAttempts >= 5) {
    user.security.lockUntil = Date.now() + 30 * 60 * 1000;
  }
  
  await user.save();
}
```

## 📊 Logging Service

### Comprehensive Audit Logging
**File**: `src/utils/logger.js`

```javascript
const healthDataLogger = {
  logHealthDataAccess: (userId, action, dataType, accessedBy, ipAddress) => {
    logger.info('Health data accessed', {
      userId,
      action,
      dataType,
      accessedBy,
      ipAddress,
      category: 'health_data_access'
    });
  },
  
  logMedicalAIInteraction: (userId, query, confidence, topics, isEmergency) => {
    logger.info('Medical AI interaction', {
      userId,
      queryLength: query?.length || 0,
      confidence,
      topics,
      isEmergency,
      category: 'medical_ai'
    });
  },
  
  logEmergencyEvent: (userId, emergencyType, level, response) => {
    logger.warn('Emergency event detected', {
      userId,
      emergencyType,
      level,
      response,
      category: 'emergency'
    });
  }
};
```

### Privacy-Compliant Logging
```javascript
// Sanitize sensitive data from logs
const sanitizeLogData = (data) => {
  return {
    ...data,
    message: data.message?.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE]'),
    email: data.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
    phone: data.phone?.replace(/(\d{3}).*(\d{3})/, '$1***$2')
  };
};
```

## 🔒 Encryption Service

### Health Data Encryption
**File**: `src/middleware/encryption.js`

```javascript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text) => {
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
};

export const decrypt = (encryptedData) => {
  if (!encryptedData?.encrypted) return null;
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('health-data', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

## 📈 Performance Monitoring

### Service Performance Metrics
```javascript
const performanceLogger = {
  logAPIPerformance: (endpoint, method, duration, statusCode, userId) => {
    logger.info('API performance', {
      endpoint,
      method,
      duration,
      statusCode,
      userId,
      category: 'performance'
    });
  },
  
  logDatabasePerformance: (operation, collection, duration, recordCount) => {
    logger.info('Database performance', {
      operation,
      collection,
      duration,
      recordCount,
      category: 'database_performance'
    });
  }
};
```

### Health Monitoring
```javascript
// Service health checks
const healthChecks = {
  database: async () => {
    try {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
  
  medicalAI: async () => {
    try {
      const testResponse = await processHealthQuery('test', [], {});
      return { status: 'healthy', confidence: testResponse.confidence };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};
```

## 🔄 Service Integration

### Inter-Service Communication
```javascript
// Event-driven architecture for service communication
const EventEmitter = require('events');
const serviceEvents = new EventEmitter();

// Emergency service listens for AI detections
serviceEvents.on('emergency_detected', async (data) => {
  await emergencyService.handleEmergencyResponse(
    data.userId,
    data.message,
    data.emergencyLevel
  );
});

// Medical AI emits emergency events
if (aiResponse.isEmergency) {
  serviceEvents.emit('emergency_detected', {
    userId,
    message,
    emergencyLevel: aiResponse.emergencyLevel
  });
}
```

### Service Dependencies
```javascript
// Dependency injection for testability
class ServiceContainer {
  constructor() {
    this.services = new Map();
  }
  
  register(name, service) {
    this.services.set(name, service);
  }
  
  get(name) {
    return this.services.get(name);
  }
}

// Usage
const container = new ServiceContainer();
container.register('medicalAI', new MedicalAIService());
container.register('emergency', new EmergencyService());
container.register('auth', new AuthService());
```
