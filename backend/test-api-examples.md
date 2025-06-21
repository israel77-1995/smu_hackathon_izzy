# API Testing Examples

## Test the Medical AI Chat Endpoint

### 1. Health Query Example
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a headache and feel tired"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Thank you for reaching out about your health...",
    "confidence": 0.8,
    "medicalTopics": ["pain_management"],
    "recommendations": [
      "Monitor pain levels and triggers",
      "Consider consulting a healthcare provider if pain persists"
    ],
    "disclaimers": [
      "This AI assistant provides general health information only...",
      "Always consult with a qualified healthcare provider...",
      "In case of emergency, contact your local emergency services...",
      "This information is processed locally to protect your privacy."
    ],
    "isEmergency": false,
    "emergencyLevel": "none",
    "timestamp": "2025-06-21T13:53:45.123Z"
  }
}
```

### 2. Mental Health Query Example
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel anxious and stressed about work"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "I understand you're going through a difficult time...",
    "confidence": 0.8,
    "medicalTopics": ["mental_health"],
    "recommendations": [
      "Consider speaking with a mental health professional",
      "Practice stress-reduction techniques"
    ],
    "isEmergency": false,
    "emergencyLevel": "none"
  }
}
```

### 3. Emergency Detection Example
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to hurt myself"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "I understand you're going through a difficult time...",
    "confidence": 0.8,
    "medicalTopics": ["mental_health"],
    "isEmergency": true,
    "emergencyLevel": "high",
    "recommendations": [
      "Consider speaking with a mental health professional",
      "Practice stress-reduction techniques"
    ]
  }
}
```

## Test Emergency Resources Endpoint

```bash
curl -X GET http://localhost:3001/api/v1/emergency/resources
```

**Expected Response:**
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
      "description": "Text \"Hi\" for confidential support",
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

## Test Health Check Endpoint

```bash
curl -X GET http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-21T13:53:45.123Z",
  "version": "1.0.0",
  "environment": "development",
  "features": {
    "medicalAI": "enabled",
    "emergencyDetection": "enabled",
    "privacyFirst": "enabled"
  }
}
```

## Frontend Integration Example

### React Component Example
```javascript
// Example of how to integrate with your React frontend
const sendMessageToAI = async (message) => {
  try {
    const response = await fetch('http://localhost:3001/api/v1/test/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Handle AI response
      console.log('AI Response:', data.data.message);
      
      // Check for emergency
      if (data.data.isEmergency) {
        console.log('EMERGENCY DETECTED:', data.data.emergencyLevel);
        // Trigger emergency UI/alerts
      }
      
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw error;
  }
};

// Usage in your ChatScreen component
const handleSendMessage = async () => {
  if (!newMessage.trim()) return;

  // Add user message to chat
  const userMessage = {
    id: Date.now().toString(),
    text: newMessage,
    sender: 'user',
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMessage]);
  setNewMessage('');

  try {
    // Get AI response from backend
    const aiResponse = await sendMessageToAI(newMessage);
    
    // Add AI response to chat
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: aiResponse.message,
      sender: 'ai',
      timestamp: new Date(),
      metadata: {
        confidence: aiResponse.confidence,
        topics: aiResponse.medicalTopics,
        isEmergency: aiResponse.isEmergency,
        recommendations: aiResponse.recommendations
      }
    };
    setMessages(prev => [...prev, aiMessage]);
    
    // Handle emergency if detected
    if (aiResponse.isEmergency) {
      // Show emergency modal or redirect to emergency resources
      setIsEmergencyModalOpen(true);
    }
    
  } catch (error) {
    console.error('Failed to get AI response:', error);
    // Show error message to user
  }
};
```

## Testing Different Scenarios

### Pain Management
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My back pain is getting worse"}'
```

### Illness Symptoms
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a fever and feel sick"}'
```

### Medication Questions
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Can I take medication for my headache?"}'
```

### Sleep Issues
```bash
curl -X POST http://localhost:3001/api/v1/test/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have trouble sleeping and feel tired"}'
```

## Notes

- All responses include medical disclaimers for safety
- Emergency detection triggers for crisis-related keywords
- The AI provides appropriate recommendations based on the query type
- All processing is done locally - no external API calls
- Responses are contextual and supportive while maintaining medical safety
