# Production Deployment Guide

## 🚀 Deployment Overview

This guide covers production deployment of Mobile Spo with security, scalability, and compliance considerations.

## 🏗️ Infrastructure Requirements

### Minimum System Requirements

#### Application Server
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended)
- **Network**: 1Gbps connection

#### Database Server
- **CPU**: 4 cores (8 recommended)
- **RAM**: 16GB (32GB recommended)
- **Storage**: 500GB SSD with backup storage
- **Network**: 1Gbps connection with low latency to app server

#### Load Balancer
- **CPU**: 2 cores
- **RAM**: 4GB
- **Network**: High bandwidth for traffic distribution

### Recommended Architecture

```
Internet
    ↓
[Load Balancer] ← SSL Termination
    ↓
[App Server 1] [App Server 2] [App Server 3]
    ↓
[Database Cluster] [Redis Cache] [File Storage]
```

## 🐳 Docker Deployment

### Docker Compose Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    depends_on:
      - mongodb
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped
    depends_on:
      - app

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/mongod.conf:/etc/mongod.conf
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped
    depends_on:
      - app
      - frontend

volumes:
  mongodb_data:
  redis_data:
```

### Production Dockerfile

```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Security: Remove unnecessary packages
RUN apk del --purge

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

USER nodejs

EXPOSE 3001

CMD ["node", "src/server.js"]
```

## 🔒 Security Configuration

### SSL/TLS Setup

```nginx
# nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name api.mobilespo.com;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/certs/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://app:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb://username:password@mongodb:27017/mobilespo_prod?authSource=admin
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your_super_secure_jwt_secret_256_bits_minimum
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your_32_character_encryption_key_here
BCRYPT_ROUNDS=12

# API Configuration
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Emergency Services
EMERGENCY_CRISIS_LINE=0800567567
EMERGENCY_SUICIDE_PREVENTION=0800121314
EMERGENCY_SERVICES=10177
EMERGENCY_SMS=31393

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/app/uploads

# Email (for notifications)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## 📊 Monitoring & Logging

### Application Monitoring

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  prometheus_data:
  grafana_data:
  elasticsearch_data:
```

### Health Checks

```javascript
// healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
      
      - name: Security audit
        run: |
          cd backend && npm audit --audit-level high
          cd ../frontend && npm audit --audit-level high

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t mobilespo/backend:${{ github.sha }} -f backend/Dockerfile.prod backend/
          docker build -t mobilespo/frontend:${{ github.sha }} -f frontend/Dockerfile.prod frontend/
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push mobilespo/backend:${{ github.sha }}
          docker push mobilespo/frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/mobilespo
            export IMAGE_TAG=${{ github.sha }}
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

## 🗄️ Database Configuration

### MongoDB Production Setup

```javascript
// mongodb/mongod.conf
storage:
  dbPath: /data/db
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8
    collectionConfig:
      blockCompressor: snappy

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen

net:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: enabled
  keyFile: /etc/mongodb/keyfile

replication:
  replSetName: "mobilespo-rs"

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="mobilespo_prod"

# Create backup
mongodump --host mongodb:27017 \
  --username $MONGO_USERNAME \
  --password $MONGO_PASSWORD \
  --db $DB_NAME \
  --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE
rm -rf $BACKUP_DIR/$DATE

# Upload to cloud storage (AWS S3 example)
aws s3 cp $BACKUP_DIR/$DATE.tar.gz s3://mobilespo-backups/mongodb/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE.tar.gz"
```

## 🔧 Performance Optimization

### Application Optimization

```javascript
// Performance middleware
const compression = require('compression');
const helmet = require('helmet');

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Connection pooling
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  useUnifiedTopology: true
};

// Redis caching
const redis = require('redis');
const client = redis.createClient({
  host: 'redis',
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] **Environment Variables**: All production variables configured
- [ ] **SSL Certificates**: Valid SSL certificates installed
- [ ] **Database**: Production database configured and secured
- [ ] **Backups**: Automated backup system in place
- [ ] **Monitoring**: Monitoring and alerting configured
- [ ] **Security**: Security headers and rate limiting enabled
- [ ] **Performance**: Caching and optimization configured
- [ ] **Health Checks**: Application health checks working
- [ ] **CI/CD**: Deployment pipeline tested
- [ ] **Documentation**: Deployment procedures documented

### Post-Deployment

- [ ] **Smoke Tests**: Basic functionality verified
- [ ] **Performance Tests**: Load testing completed
- [ ] **Security Scan**: Vulnerability assessment passed
- [ ] **Monitoring**: Metrics and logs flowing correctly
- [ ] **Backup Verification**: Backup and restore tested
- [ ] **Incident Response**: On-call procedures activated
- [ ] **Documentation**: Runbooks updated
- [ ] **Team Notification**: Deployment communicated to team

## 🆘 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep -E "(NODE_ENV|MONGODB_URI|JWT_SECRET)"

# Check database connection
docker-compose exec app node -e "require('./src/database/connection.js')"
```

#### High Memory Usage
```bash
# Monitor memory usage
docker stats

# Check for memory leaks
docker-compose exec app node --inspect=0.0.0.0:9229 src/server.js

# Restart services if needed
docker-compose restart app
```

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Check connection from app
docker-compose exec app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => console.log('Connected'));
"
```

### Emergency Procedures

#### Service Outage
1. Check service status: `docker-compose ps`
2. Review logs: `docker-compose logs --tail=100`
3. Restart affected services: `docker-compose restart <service>`
4. Notify stakeholders
5. Document incident

#### Data Recovery
1. Stop application: `docker-compose stop app`
2. Restore from backup: `./restore-backup.sh <backup_date>`
3. Verify data integrity
4. Restart application: `docker-compose start app`
5. Validate functionality
