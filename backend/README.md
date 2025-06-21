# Mobile Spo Backend - Privacy-First Medical AI

A secure, privacy-focused backend for the Mobile Spo health application with integrated medical AI capabilities.

## 🏥 Features

- **Privacy-First Medical AI**: Local processing ensures health data never leaves your infrastructure
- **Emergency Detection**: Automatic crisis intervention and emergency response
- **Secure Health Data**: End-to-end encryption with healthcare compliance
- **Real-time Chat**: WebSocket support for instant medical consultations
- **Audit Logging**: Comprehensive tracking for healthcare compliance
- **Multi-language Support**: English, Afrikaans, Zulu, Xhosa

## 🔒 Security & Privacy

- **Local AI Processing**: No health data sent to external APIs
- **Data Encryption**: AES-256 encryption for sensitive health information
- **HIPAA-Ready**: Designed with healthcare compliance in mind
- **Audit Trails**: Complete logging of all health data access
- **Rate Limiting**: Protection against abuse and attacks
- **Secure Authentication**: JWT with bcrypt password hashing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB
   mongod
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Medical AI Chat
- `POST /api/v1/chat/message` - Send message to medical AI
- `GET /api/v1/chat/conversations` - Get conversation history
- `GET /api/v1/chat/conversation/:id` - Get specific conversation
- `DELETE /api/v1/chat/conversation/:id` - Delete conversation
- `POST /api/v1/chat/feedback` - Submit AI response feedback

### Health Data
- `GET /api/v1/health/profile` - Get health profile
- `PUT /api/v1/health/profile` - Update health profile
- `POST /api/v1/health/journal` - Add journal entry
- `GET /api/v1/health/journal` - Get journal entries
- `POST /api/v1/health/mood` - Log mood data

### Appointments
- `GET /api/v1/appointments` - Get appointments
- `POST /api/v1/appointments` - Book appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Cancel appointment

### Emergency
- `POST /api/v1/emergency/alert` - Trigger emergency alert
- `GET /api/v1/emergency/resources` - Get emergency resources
- `POST /api/v1/emergency/contact` - Contact emergency services

## 🤖 Medical AI Configuration

The system uses a privacy-first approach with local AI processing:

### Current Implementation
- **Rule-based AI**: Immediate deployment with medical knowledge base
- **Local Processing**: No data sent to external services
- **Emergency Detection**: Automatic crisis intervention
- **Medical Disclaimers**: Appropriate legal disclaimers

### Future Enhancements
- **BioBERT Integration**: Medical literature trained model
- **Custom Medical Model**: Fine-tuned for South African healthcare
- **Symptom Analysis**: Advanced diagnostic assistance
- **Drug Interaction Checking**: Medication safety

## 🗄️ Database Schema

### Users Collection
```javascript
{
  email: String,
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    phoneNumber: String
  },
  healthProfile: {
    conditions: [Object],
    medications: [Object],
    allergies: [Object],
    emergencyContacts: [Object]
  },
  subscription: Object,
  settings: Object,
  security: Object,
  audit: Object
}
```

### Conversations Collection
```javascript
{
  userId: ObjectId,
  messages: [{
    sender: String, // 'user' | 'ai'
    content: String,
    timestamp: Date,
    metadata: Object
  }],
  isEmergency: Boolean,
  emergencyLevel: String
}
```

## 🚨 Emergency Response System

The system includes automatic emergency detection:

### Emergency Levels
- **Critical**: Immediate intervention required
- **High**: Urgent response needed  
- **Moderate**: Monitor and support

### South African Emergency Contacts
- **Crisis Helpline**: 0800 567 567
- **Suicide Prevention**: 0800 12 13 14
- **Emergency Services**: 10177
- **SMS Counseling**: 31393

## 📊 Monitoring & Logging

### Log Categories
- **Health Data Access**: All health information access
- **Medical AI Interactions**: AI query processing
- **Emergency Events**: Crisis detection and response
- **Authentication**: Login/logout events
- **Security Events**: Suspicious activities
- **Performance**: API and database performance

### Log Files
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/audit.log` - Health data access audit
- `logs/exceptions.log` - Unhandled exceptions

## 🔧 Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

## 🌍 Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure secure MongoDB connection
3. Set strong JWT secrets
4. Enable SSL/TLS
5. Configure proper CORS origins
6. Set up log rotation
7. Configure backup strategies

### Docker Deployment
```bash
# Build image
docker build -t mobile-spo-backend .

# Run container
docker run -p 3001:3001 mobile-spo-backend
```

## 📋 Compliance

### Healthcare Compliance Features
- **Data Encryption**: AES-256 for sensitive data
- **Access Logging**: Complete audit trails
- **Data Retention**: Configurable retention policies
- **User Consent**: Granular privacy controls
- **Data Export**: Patient data portability
- **Secure Deletion**: Proper data disposal

### Privacy Controls
- **Local Processing**: AI runs on your infrastructure
- **Minimal Data Collection**: Only necessary health data
- **User Control**: Patients control their data sharing
- **Anonymization**: Research data anonymization options

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**⚠️ Important**: This is a medical application. Always ensure proper testing, security reviews, and compliance with local healthcare regulations before production deployment.
