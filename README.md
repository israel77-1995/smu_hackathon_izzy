# 🏥 Mobile Spo - AI Health Assistant

> **Revolutionizing Healthcare Access in South Africa**

A privacy-first AI health assistant designed to democratize healthcare access across South Africa, featuring real-time crisis intervention, multi-language support, and universal accessibility through both smartphone apps and USSD integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74+-blue.svg)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)

## ✨ Features

### 🚨 **Life-Saving Crisis Intervention**
- Real-time detection of suicidal ideation and self-harm
- Immediate connection to South African crisis resources
- 24/7 emergency support with local contact numbers

### 🔒 **Privacy-First AI Health Assistant**
- Local AI processing - no personal data sent to cloud
- Medical guidance in multiple South African languages
- Symptom tracking and health journaling
- GDPR compliant with data sovereignty

### 📱 **Universal Accessibility**
- **Mobile App**: Full-featured React Native application
- **USSD Integration**: Works on any phone (*123# style codes)
- **Multi-language**: English, isiZulu, Sesotho, French
- **Offline Capable**: Core features work without internet

### 👥 **Community Support**
- Peer-to-peer health discussions
- Anonymous support groups
- Success story sharing
- Moderated safe spaces

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6.0+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))
- **Expo CLI** (for mobile development)

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/israel77-1995/smu_hackathon_izzy.git
   cd smu_hackathon_izzy
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../MobileSpoApp
   npm install
   ```

4. **Set up Environment Variables**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

### 🏃‍♂️ Running the Application

#### **Start Backend Server**
```bash
cd backend
npm start
```
The backend will be available at `http://localhost:3001`

#### **Start Mobile App**
```bash
cd MobileSpoApp
npm start
```
The app will be available at `http://localhost:8081`

#### **Verify Everything is Working**
1. Open `http://localhost:3001/health` - Should show backend health status
2. Open `http://localhost:8081` - Should show the Mobile Spo app
3. Test AI chat functionality
4. Test emergency detection with "I want to hurt myself"

## 📱 Using the Application

### **Mobile App Features**

#### **🏠 Home Screen**
- Quick health mood selector
- Access to all main features
- Recent activity overview
- Emergency crisis support button

#### **🤖 AI Health Chat**
- Type health questions in natural language
- Get instant medical guidance with disclaimers
- Automatic emergency detection and intervention
- Privacy-first local processing

#### **📝 Health Journal**
- Daily mood tracking (1-5 scale with emojis)
- Symptom selection from common conditions
- Personal notes and observations
- Historical tracking and patterns

#### **👥 Community Support**
- Browse support posts by category
- Share experiences anonymously
- Like and comment on posts
- Connect with others on similar health journeys

#### **📚 Health Resources**
- Categorized health information
- Emergency contact numbers
- Educational content
- Crisis intervention resources

#### **🚨 Emergency Features**
- Real-time crisis detection in chat
- Immediate popup with local resources
- South African emergency contacts:
  - **Crisis Helpline**: 0800567567
  - **Suicide Prevention**: 0800121314
  - **Emergency Services**: 10177
  - **SMS Counseling**: 31393

### **Testing Emergency Detection**

To test the crisis intervention system:

1. Go to the AI Chat screen
2. Type: `"I want to hurt myself"`
3. The AI will detect this as a high-priority emergency
4. You'll see an emergency alert with local crisis resources
5. The system connects users to appropriate South African support services

## 🛠️ Development

### **Project Structure**
```
smu_hackathon_izzy/
├── backend/                           # Node.js Express API server
│   ├── src/
│   │   ├── controllers/               # API route handlers
│   │   ├── models/                    # MongoDB data models
│   │   ├── services/                  # Business logic (AI, emergency detection)
│   │   ├── middleware/                # Authentication, logging, etc.
│   │   └── server.js                  # Main server file
│   ├── docs/                          # API documentation
│   └── package.json
├── MobileSpoApp/                      # React Native mobile application
│   ├── App.tsx                        # Main app component with all screens
│   ├── assets/                        # Images, fonts, etc.
│   └── package.json
├── docs/                              # Project documentation
├── presentation/                      # Demo materials
└── mobile-spo-presentation.html      # Hackathon presentation
```

### **Backend API Endpoints**

#### **Health Check**
```bash
GET /health
# Returns server status and configuration
```

#### **AI Chat**
```bash
POST /api/v1/test/chat
Content-Type: application/json

{
    "message": "I have a headache and feel tired"
}
```

#### **Emergency Resources**
```bash
GET /api/v1/emergency/resources
# Returns South African crisis contact information
```

### **Environment Configuration**

Create `backend/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mobile-spo

# Security
JWT_SECRET=your-super-secret-jwt-key

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:8082

# Logging
LOG_LEVEL=info
```

## 🧪 Testing

### **Manual Testing**

1. **Backend Health Check**
   ```bash
   curl http://localhost:3001/health
   ```

2. **AI Chat Test**
   ```bash
   curl -X POST http://localhost:3001/api/v1/test/chat \
       -H "Content-Type: application/json" \
       -d '{"message": "I have a headache"}'
   ```

3. **Emergency Detection Test**
   ```bash
   curl -X POST http://localhost:3001/api/v1/test/chat \
       -H "Content-Type: application/json" \
       -d '{"message": "I want to hurt myself"}'
   ```

### **Frontend Testing**

1. Navigate through all app screens
2. Test mood selector functionality
3. Add journal entries with symptoms
4. Browse community posts
5. Access health resources
6. Test emergency modal

## 🚀 Deployment

### **Production Environment**

1. **Set up MongoDB Atlas** or production MongoDB instance
2. **Configure environment variables** for production
3. **Deploy backend** to cloud provider (AWS, Azure, Google Cloud)
4. **Build mobile app** for app stores
5. **Set up USSD gateway** for feature phone integration

### **Environment Variables for Production**

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mobile-spo
JWT_SECRET=your-production-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
LOG_LEVEL=warn
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure emergency detection features are thoroughly tested
- Respect privacy-first principles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **For Users**
- **Crisis Support**: If you're in crisis, please contact emergency services immediately
- **Technical Issues**: Open an issue on GitHub
- **General Questions**: Check our documentation

### **Emergency Contacts (South Africa)**
- **Crisis Helpline**: 0800567567
- **Suicide Prevention**: 0800121314
- **Emergency Services**: 10177
- **SMS Counseling**: 31393

## 🙏 Acknowledgments

- South African healthcare professionals who provided guidance
- Crisis intervention specialists who reviewed our emergency detection
- Open source community for the amazing tools and libraries
- MongoDB for database support
- React Native and Expo teams for mobile development platform

---

**Built with ❤️ for South Africa 🇿🇦**

*Mobile Spo - Making healthcare accessible to everyone, everywhere.*
