# 📱 Mobile Spo USSD Integration

## Overview

The Mobile Spo USSD (Unstructured Supplementary Service Data) integration provides healthcare access to users with basic feature phones, ensuring universal accessibility across South Africa regardless of smartphone ownership or internet connectivity.

## 🌍 Why USSD for Healthcare?

### Universal Access
- **No smartphone required** - Works on any mobile phone
- **No internet needed** - Uses cellular network infrastructure
- **Instant access** - No app downloads or installations
- **Low cost** - Minimal data charges, often free

### South African Context
- **Rural accessibility** - Reaches remote communities
- **Economic inclusion** - Serves low-income populations
- **Language support** - Multi-language interface
- **Emergency access** - 24/7 availability for crisis situations

## 🚀 Features

### Core Services
1. **AI Health Chat** - Basic symptom assessment and health guidance
2. **Emergency Support** - Immediate crisis intervention and emergency contacts
3. **Appointment Booking** - Schedule healthcare appointments
4. **Health Tips** - Daily wellness advice and education
5. **Multi-language Support** - English, Afrikaans, isiZulu, Sesotho, isiXhosa

### Technical Features
- Session management with timeout handling
- Rate limiting for abuse prevention
- Privacy-focused logging
- Telecom provider authentication
- Analytics and monitoring

## 📞 How to Access

### For Users
1. **Dial the USSD code**: `*123*456#`
2. **Follow the menu prompts**
3. **Select services using number keys**
4. **Get instant health support**

### USSD Code Structure
```
*123*456#           - Main menu
*123*456*1#         - Direct to health chat
*123*456*2#         - Emergency services
*123*456*3#         - Appointment booking
*123*456*4#         - Health tips
*123*456*5#         - Language selection
```

## 🔧 Technical Implementation

### API Endpoints

#### Main Gateway
```
POST /api/v1/ussd/gateway
```

**Request Format:**
```json
{
  "phoneNumber": "+27123456789",
  "text": "user input",
  "sessionId": "unique_session_id"
}
```

**Response Format:**
```json
{
  "message": "Menu or response text",
  "continueSession": true,
  "type": "menu|input|end"
}
```

#### Service Status
```
GET /api/v1/ussd/status
```

#### Analytics
```
GET /api/v1/ussd/analytics
```

#### Webhook Support
```
POST /api/v1/ussd/webhook
```

### Session Management

#### Session Lifecycle
1. **Session Start** - User dials USSD code
2. **Menu Navigation** - User selects options
3. **Service Interaction** - Health chat, tips, etc.
4. **Session End** - User exits or timeout

#### Session Data
```javascript
{
  id: "session_id",
  phoneNumber: "+27123456789",
  language: "english",
  state: "main_menu",
  context: {},
  inputHistory: [],
  createdAt: Date,
  lastActivity: Date
}
```

### Language Support

#### Supported Languages
- **English** (Primary)
- **Afrikaans** 
- **isiZulu**
- **Sesotho**
- **isiXhosa**

#### Localization Example
```javascript
const texts = {
  english: {
    main_menu: "🏥 Mobile Spo Health Assistant\n1. Health Chat\n2. Emergency Help\n...",
    emergency_info: "🚨 EMERGENCY CONTACTS:\nCrisis: 0800567567\n..."
  },
  afrikaans: {
    main_menu: "🏥 Mobile Spo Gesondheidsassistent\n1. Gesondheidskletsie\n...",
    // ...
  }
};
```

## 🛡️ Security & Privacy

### Data Protection
- **Minimal data collection** - Only essential session data
- **No health data storage** - Conversations not permanently stored
- **Phone number anonymization** - Partial masking in logs
- **Session encryption** - Secure data transmission

### Rate Limiting
- **20 requests per minute** per phone number
- **Session timeout** - 5 minutes of inactivity
- **Abuse prevention** - Automatic blocking of suspicious activity

### Authentication
- **Telecom provider verification** - API key authentication
- **Request validation** - Sanitized input processing
- **Audit logging** - Comprehensive request tracking

## 📊 Analytics & Monitoring

### Usage Metrics
- Total sessions and active users
- Popular features and language distribution
- Average session duration
- Emergency calls triggered
- Appointments booked

### Health Impact Tracking
- Crisis interventions performed
- Health tips delivered
- User engagement patterns
- Geographic usage distribution

## 🧪 Testing & Development

### USSD Simulator
Access the web-based simulator at: `ussd-simulator/index.html`

Features:
- **Interactive testing** - Full USSD flow simulation
- **Multi-language testing** - Switch between languages
- **Emergency scenarios** - Test crisis detection
- **Session management** - Start/end session controls

### Test Endpoints
```bash
# Test USSD flow
curl -X POST http://localhost:3001/api/v1/ussd/test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+27123456789", "text": "1"}'

# Check service status
curl http://localhost:3001/api/v1/ussd/status
```

## 🚀 Deployment

### Telecom Provider Integration

#### Requirements
1. **USSD short code** - Obtain from telecom provider
2. **Webhook endpoints** - Configure callback URLs
3. **Authentication** - Set up API keys
4. **Load balancing** - Handle high traffic volumes

#### Provider Configuration
```javascript
// Example configuration for major SA providers
const providers = {
  mtn: {
    webhook_url: "https://api.mobilespo.co.za/ussd/webhook",
    auth_method: "api_key",
    rate_limit: 1000
  },
  vodacom: {
    webhook_url: "https://api.mobilespo.co.za/ussd/webhook", 
    auth_method: "oauth2",
    rate_limit: 800
  },
  cell_c: {
    webhook_url: "https://api.mobilespo.co.za/ussd/webhook",
    auth_method: "api_key", 
    rate_limit: 500
  }
};
```

### Production Environment

#### Environment Variables
```bash
# USSD Configuration
USSD_ENABLED=true
USSD_SESSION_TIMEOUT=300000
USSD_RATE_LIMIT_WINDOW=60000
USSD_RATE_LIMIT_MAX=20

# Provider Authentication
MTN_API_KEY=your_mtn_api_key
VODACOM_CLIENT_ID=your_vodacom_client_id
VODACOM_CLIENT_SECRET=your_vodacom_secret
CELL_C_API_KEY=your_cell_c_api_key

# Monitoring
USSD_ANALYTICS_ENABLED=true
USSD_LOGGING_LEVEL=info
```

#### Scaling Considerations
- **Horizontal scaling** - Multiple server instances
- **Session storage** - Redis for distributed sessions
- **Database optimization** - Fast response times
- **CDN integration** - Global content delivery

## 📈 Business Impact

### Accessibility Metrics
- **Universal reach** - 100% mobile phone coverage
- **Cost effectiveness** - Minimal infrastructure requirements
- **Immediate deployment** - No user education needed
- **Emergency readiness** - 24/7 crisis support

### Social Impact
- **Healthcare equity** - Equal access regardless of device
- **Rural healthcare** - Reaches underserved communities  
- **Crisis prevention** - Immediate mental health support
- **Health education** - Daily tips and awareness

## 🔮 Future Enhancements

### Planned Features
1. **Voice integration** - Audio responses for accessibility
2. **SMS fallback** - Alternative for USSD unavailability
3. **Offline sync** - Store-and-forward for poor connectivity
4. **AI improvements** - Enhanced natural language processing
5. **Integration expansion** - Connect with more health services

### Advanced Capabilities
- **Predictive health alerts** - Proactive health monitoring
- **Community health mapping** - Geographic health insights
- **Telemedicine integration** - Direct doctor connections
- **Prescription management** - Medication reminders and refills

## 📞 Support & Contact

### Technical Support
- **Documentation**: `/docs/api/ussd`
- **Status Page**: `status.mobilespo.co.za`
- **Developer Portal**: `developers.mobilespo.co.za`

### Emergency Contacts
- **Crisis Helpline**: 0800567567
- **Suicide Prevention**: 0800121314
- **Emergency Services**: 10177
- **SMS Support**: 31393

---

**Mobile Spo USSD Integration - Making healthcare accessible to everyone, everywhere. 🏥📱**
