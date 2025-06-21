# Medical AI API Documentation

## 🤖 Overview

The Medical AI API provides privacy-first health consultation services with automatic emergency detection and medical topic classification.

## 🔒 Privacy & Security

- **Local Processing**: All health data processed on your infrastructure
- **No External APIs**: Health information never leaves your servers
- **Encryption**: Sensitive data encrypted at rest and in transit
- **Audit Logging**: Complete access tracking for compliance

## 📡 Base URL

```
Production: https://api.mobilespo.com/v1
Development: http://localhost:3001/api/v1
```

## 🔐 Authentication

All protected endpoints require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

## 🩺 Medical AI Endpoints

### Send Chat Message

Process a health-related message with the medical AI.

**Endpoint:** `POST /chat/message`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "message": "I have a headache and feel tired",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123456789",
    "message": "I understand you're experiencing a headache and fatigue. These symptoms can have various causes...",
    "confidence": 0.85,
    "medicalTopics": ["pain_management", "general_health"],
    "recommendations": [
      "Monitor pain levels and triggers",
      "Consider consulting a healthcare provider if symptoms persist",
      "Ensure adequate hydration and rest"
    ],
    "disclaimers": [
      "This AI assistant provides general health information only and is not a substitute for professional medical advice.",
      "Always consult with a qualified healthcare provider for medical concerns.",
      "In case of emergency, contact your local emergency services immediately."
    ],
    "isEmergency": false,
    "emergencyLevel": "none",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Emergency Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123456789",
    "message": "I understand you're going through a difficult time. It's important to know that you're not alone...",
    "confidence": 0.95,
    "medicalTopics": ["mental_health"],
    "recommendations": [
      "Consider speaking with a mental health professional",
      "Contact crisis support services immediately"
    ],
    "isEmergency": true,
    "emergencyLevel": "high",
    "emergency": {
      "level": "high",
      "resources": {
        "crisis": {
          "name": "Crisis Helpline",
          "number": "0800567567",
          "description": "Free 24/7 mental health crisis support",
          "available": "24/7"
        },
        "suicide": {
          "name": "Suicide Prevention Lifeline",
          "number": "0800121314",
          "description": "Immediate suicide prevention support",
          "available": "24/7"
        },
        "emergency": {
          "name": "Emergency Services",
          "number": "10177",
          "description": "Police, ambulance, fire services",
          "available": "24/7"
        },
        "sms": {
          "name": "SMS Counseling",
          "number": "31393",
          "description": "Text 'Hi' for confidential support",
          "available": "24/7"
        }
      }
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "message",
      "message": "Message must be between 1 and 1000 characters"
    }
  ]
}
```

### Get Conversation History

Retrieve user's conversation history.

**Endpoint:** `GET /chat/conversations`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_123456789",
        "lastActivity": "2024-01-15T10:30:00.000Z",
        "isEmergency": false,
        "emergencyLevel": "none",
        "messageCount": 6,
        "lastMessage": "Thank you for the advice. I'm feeling better now..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

### Get Specific Conversation

Retrieve details of a specific conversation.

**Endpoint:** `GET /chat/conversation/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv_123456789",
    "userId": "user_123",
    "messages": [
      {
        "sender": "user",
        "content": "I have a headache",
        "timestamp": "2024-01-15T10:25:00.000Z"
      },
      {
        "sender": "ai",
        "content": "I understand you're experiencing a headache...",
        "timestamp": "2024-01-15T10:25:30.000Z",
        "metadata": {
          "confidence": 0.85,
          "medicalTopics": ["pain_management"],
          "recommendations": ["Monitor pain levels"]
        }
      }
    ],
    "isEmergency": false,
    "emergencyLevel": "none",
    "lastActivity": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🚨 Emergency Endpoints

### Get Emergency Resources

Retrieve emergency contact information and resources.

**Endpoint:** `GET /emergency/resources`

**Response:**
```json
{
  "success": true,
  "data": {
    "crisis": {
      "name": "Crisis Helpline",
      "number": "0800567567",
      "description": "Free 24/7 mental health crisis support",
      "available": "24/7"
    },
    "suicide": {
      "name": "Suicide Prevention Lifeline",
      "number": "0800121314",
      "description": "Immediate suicide prevention support",
      "available": "24/7"
    },
    "emergency": {
      "name": "Emergency Services",
      "number": "10177",
      "description": "Police, ambulance, fire services",
      "available": "24/7"
    },
    "sms": {
      "name": "SMS Counseling",
      "number": "31393",
      "description": "Text 'Hi' for confidential support",
      "available": "24/7"
    },
    "local": {
      "name": "Nearest Clinic",
      "description": "Serenity Wellness Center - 2.3km away",
      "hours": "Open 24/7 • Walk-ins welcome"
    }
  }
}
```

## 🏷️ Medical Topics

The AI classifies health queries into these topics:

| Topic | Description | Examples |
|-------|-------------|----------|
| `pain_management` | Pain-related queries | Headaches, back pain, joint pain |
| `mental_health` | Mental health concerns | Anxiety, depression, stress |
| `illness` | General illness symptoms | Fever, nausea, fatigue |
| `medication` | Medication questions | Drug interactions, dosages |
| `sleep_health` | Sleep-related issues | Insomnia, sleep disorders |
| `general_health` | General health queries | Wellness, prevention |

## 🚨 Emergency Levels

| Level | Description | Response |
|-------|-------------|----------|
| `critical` | Immediate danger | Suicide risk, severe medical emergency |
| `high` | Urgent response needed | Self-harm, severe symptoms |
| `moderate` | Monitor and support | General emergencies, persistent pain |
| `none` | No emergency detected | Normal health consultation |

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## 🔄 Rate Limiting

- **Standard Users**: 100 requests per 15 minutes
- **Premium Users**: 500 requests per 15 minutes
- **Emergency Endpoints**: No rate limiting

## 📝 Request Validation

### Message Validation
- **Length**: 1-1000 characters
- **Content**: Text only, no HTML/scripts
- **Language**: English, Afrikaans, Zulu, Xhosa supported

### Security Measures
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## 🧪 Testing Endpoints

For development and testing, use these endpoints without authentication:

**Test Chat:** `POST /test/chat`
```json
{
  "message": "I have a headache"
}
```

**Health Check:** `GET /health`
```json
{
  "status": "healthy",
  "features": {
    "medicalAI": "enabled",
    "emergencyDetection": "enabled",
    "privacyFirst": "enabled"
  }
}
```

## 📚 SDKs and Examples

### JavaScript/TypeScript
```typescript
import { apiClient } from './services/api';

// Send chat message
const response = await apiClient.sendChatMessage(
  "I have a headache and feel tired"
);

// Handle emergency
if (response.data.isEmergency) {
  showEmergencyModal(response.data.emergency);
}
```

### cURL Examples
```bash
# Send chat message
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a headache"}'

# Get emergency resources
curl -X GET http://localhost:3001/api/v1/emergency/resources
```

## 🔍 Monitoring & Analytics

### Metrics Tracked
- Response times
- Emergency detection rates
- User engagement
- Error rates
- Medical topic distribution

### Audit Logging
All medical AI interactions are logged for:
- Compliance requirements
- Quality improvement
- Emergency response analysis
- User safety monitoring
