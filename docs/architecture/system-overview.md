# System Architecture Overview

## 🏗️ High-Level Architecture

Mobile Spo follows a modern three-tier architecture with clear separation of concerns:

```mermaid
graph TB
    subgraph "Presentation Layer"
        A[React Frontend]
        B[Mobile App]
        C[Admin Dashboard]
    end
    
    subgraph "Application Layer"
        D[API Gateway]
        E[Authentication Service]
        F[Medical AI Service]
        G[Emergency Service]
        H[Notification Service]
    end
    
    subgraph "Data Layer"
        I[MongoDB]
        J[Redis Cache]
        K[File Storage]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    E --> I
    F --> I
    G --> I
    H --> J
```

## 🔧 Component Architecture

### Frontend Architecture (React)

```
src/
├── components/           # Reusable UI Components
│   ├── ui/              # Base UI Components (shadcn/ui)
│   ├── forms/           # Form Components
│   ├── modals/          # Modal Components
│   └── screens/         # Screen Components
├── services/            # External Service Integration
│   ├── api.ts           # API Client
│   ├── auth.ts          # Authentication Service
│   └── storage.ts       # Local Storage Service
├── hooks/               # Custom React Hooks
│   ├── useChat.ts       # Chat State Management
│   ├── useAuth.ts       # Authentication Hook
│   └── useEmergency.ts  # Emergency Detection Hook
├── types/               # TypeScript Type Definitions
│   ├── api.ts           # API Response Types
│   ├── chat.ts          # Chat Message Types
│   └── user.ts          # User Data Types
├── utils/               # Utility Functions
│   ├── validation.ts    # Input Validation
│   ├── formatting.ts    # Data Formatting
│   └── constants.ts     # Application Constants
└── contexts/            # React Context Providers
    ├── AuthContext.tsx  # Authentication Context
    └── ThemeContext.tsx # Theme Management
```

### Backend Architecture (Node.js)

```
src/
├── routes/              # API Route Handlers
│   ├── auth.js          # Authentication Routes
│   ├── chat.js          # Medical AI Chat Routes
│   ├── health.js        # Health Data Routes
│   ├── emergency.js     # Emergency Response Routes
│   └── users.js         # User Management Routes
├── services/            # Business Logic Services
│   ├── medicalAI.js     # Medical AI Processing
│   ├── emergencyService.js # Emergency Detection
│   ├── conversationService.js # Chat Management
│   └── notificationService.js # Notifications
├── models/              # Database Models
│   ├── User.js          # User Data Model
│   ├── Conversation.js  # Chat Conversation Model
│   ├── HealthRecord.js  # Health Data Model
│   └── Emergency.js     # Emergency Event Model
├── middleware/          # Express Middleware
│   ├── auth.js          # Authentication Middleware
│   ├── validation.js    # Input Validation
│   ├── encryption.js    # Data Encryption
│   └── errorHandler.js  # Error Handling
├── utils/               # Utility Functions
│   ├── logger.js        # Logging Service
│   ├── encryption.js    # Encryption Utilities
│   └── validators.js    # Data Validators
└── database/            # Database Configuration
    ├── connection.js    # MongoDB Connection
    ├── migrations/      # Database Migrations
    └── seeds/           # Test Data Seeds
```

## 🔄 Data Flow Architecture

### Medical AI Chat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant M as Medical AI
    participant E as Emergency Service
    participant D as Database
    
    U->>F: Send health message
    F->>A: POST /api/v1/chat/message
    A->>M: Process health query
    M->>M: Analyze for medical topics
    M->>M: Check for emergency keywords
    alt Emergency Detected
        M->>E: Trigger emergency response
        E->>F: Send emergency alert
    end
    M->>D: Save conversation
    M->>A: Return AI response
    A->>F: Return formatted response
    F->>U: Display AI response + emergency UI
```

### Emergency Detection Flow

```mermaid
flowchart TD
    A[User Message] --> B[Medical AI Analysis]
    B --> C{Emergency Keywords?}
    C -->|Yes| D[Classify Emergency Level]
    C -->|No| E[Normal Response]
    D --> F{Emergency Level}
    F -->|Critical| G[Immediate Intervention]
    F -->|High| H[Urgent Response]
    F -->|Moderate| I[Monitor & Support]
    G --> J[Emergency Modal + Resources]
    H --> J
    I --> J
    J --> K[Log Emergency Event]
    E --> L[Standard AI Response]
```

## 🔒 Security Architecture

### Authentication & Authorization

```mermaid
graph LR
    A[User Login] --> B[JWT Token]
    B --> C[API Request]
    C --> D[Auth Middleware]
    D --> E{Valid Token?}
    E -->|Yes| F[Access Granted]
    E -->|No| G[Access Denied]
    F --> H[Health Data Access]
    H --> I[Audit Log]
```

### Data Encryption Layers

1. **Transport Layer**: HTTPS/TLS encryption
2. **Application Layer**: JWT token encryption
3. **Database Layer**: Field-level encryption for sensitive data
4. **Storage Layer**: Encrypted file storage

## 📊 Scalability Architecture

### Horizontal Scaling Strategy

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end
    
    subgraph "Application Servers"
        AS1[Node.js Instance 1]
        AS2[Node.js Instance 2]
        AS3[Node.js Instance 3]
    end
    
    subgraph "Database Cluster"
        DB1[MongoDB Primary]
        DB2[MongoDB Secondary]
        DB3[MongoDB Secondary]
    end
    
    subgraph "Cache Layer"
        R1[Redis Cluster]
    end
    
    LB --> AS1
    LB --> AS2
    LB --> AS3
    AS1 --> DB1
    AS2 --> DB1
    AS3 --> DB1
    DB1 --> DB2
    DB1 --> DB3
    AS1 --> R1
    AS2 --> R1
    AS3 --> R1
```

## 🔧 Technology Stack

### Frontend Technologies
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Hooks + Context API
- **HTTP Client**: Fetch API with custom wrapper
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Infrastructure Technologies
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Process Management**: PM2
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## 🔄 Development Workflow

### CI/CD Pipeline

```mermaid
graph LR
    A[Code Commit] --> B[GitHub Actions]
    B --> C[Run Tests]
    C --> D[Build Application]
    D --> E[Security Scan]
    E --> F[Deploy to Staging]
    F --> G[Integration Tests]
    G --> H[Deploy to Production]
```

### Environment Strategy
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: High-availability production deployment

## 📈 Performance Considerations

### Optimization Strategies
1. **Frontend**: Code splitting, lazy loading, image optimization
2. **Backend**: Connection pooling, query optimization, caching
3. **Database**: Indexing, aggregation pipelines, read replicas
4. **Network**: CDN, compression, HTTP/2

### Monitoring & Alerting
- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Business Metrics**: User engagement, emergency response times
- **Security Metrics**: Failed login attempts, suspicious activities
