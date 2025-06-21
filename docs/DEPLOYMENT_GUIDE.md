# 🚀 Mobile Spo Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Mobile Spo to a production environment. The deployment uses Docker containers orchestrated with Docker Compose, providing a scalable, secure, and maintainable healthcare platform.

## 🏗️ Architecture Overview

### Production Stack
- **Backend API**: Node.js with Express (containerized)
- **Database**: MongoDB with authentication and encryption
- **Cache/Sessions**: Redis for session management and caching
- **Reverse Proxy**: Nginx with SSL termination and rate limiting
- **Monitoring**: Prometheus + Grafana for metrics and alerting
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Security**: HIPAA-compliant encryption and audit logging

### Network Architecture
```
Internet → Nginx (SSL/TLS) → Backend API → MongoDB/Redis
                ↓
        Monitoring Stack (Prometheus/Grafana)
                ↓
        Logging Stack (ELK)
```

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or CentOS 8+ (recommended)
- **CPU**: Minimum 4 cores, 8 cores recommended
- **RAM**: Minimum 8GB, 16GB recommended
- **Storage**: Minimum 100GB SSD, 500GB recommended
- **Network**: Static IP address with domain name

### Software Dependencies
- Docker 24.0+
- Docker Compose 2.0+
- Git
- curl
- openssl

### Domain and SSL
- Registered domain name (e.g., mobilespo.co.za)
- SSL certificate (Let's Encrypt or commercial)
- DNS records configured

## 🔧 Pre-Deployment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Clone the Mobile Spo repository
git clone https://github.com/your-org/mobile-spo.git
cd mobile-spo

# Checkout production branch
git checkout production
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.prod.template .env.prod

# Edit environment variables
nano .env.prod
```

**Critical Environment Variables to Configure:**

```bash
# Database passwords
MONGO_ROOT_PASSWORD=your-secure-mongo-password
REDIS_PASSWORD=your-secure-redis-password

# JWT and encryption keys
JWT_SECRET=your-jwt-secret-minimum-32-characters
HEALTH_DATA_ENCRYPTION_KEY=your-encryption-key-32-chars
SESSION_SECRET=your-session-secret-32-characters

# External API keys
OPENAI_API_KEY=sk-your-openai-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Domain configuration
FRONTEND_URL=https://mobilespo.co.za
ALLOWED_ORIGINS=https://mobilespo.co.za,https://www.mobilespo.co.za
```

### 4. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d mobilespo.co.za -d www.mobilespo.co.za

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/mobilespo.co.za/fullchain.pem ./nginx/ssl/mobilespo.crt
sudo cp /etc/letsencrypt/live/mobilespo.co.za/privkey.pem ./nginx/ssl/mobilespo.key
```

#### Option B: Commercial Certificate
```bash
# Copy your SSL certificate files
cp your-certificate.crt ./nginx/ssl/mobilespo.crt
cp your-private-key.key ./nginx/ssl/mobilespo.key
```

### 5. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Grafana (optional, can be restricted)
```

## 🚀 Deployment Process

### 1. Automated Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run full deployment
./scripts/deploy.sh deploy
```

### 2. Manual Deployment Steps

If you prefer manual deployment:

```bash
# Create necessary directories
mkdir -p logs backups nginx/ssl nginx/logs

# Pull and build images
docker-compose -f docker-compose.prod.yml pull
docker build -f backend/Dockerfile.prod -t mobile-spo-backend:latest ./backend

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

### 3. Post-Deployment Verification

```bash
# Check service health
curl -f http://localhost:3001/health

# Check SSL certificate
curl -I https://mobilespo.co.za

# Verify database connection
docker-compose -f docker-compose.prod.yml exec backend node -e "
  const { connectDatabase } = require('./src/database/connection.js');
  connectDatabase().then(() => console.log('DB OK')).catch(console.error);
"
```

## 📊 Monitoring Setup

### 1. Access Monitoring Dashboards

- **Grafana**: http://your-server:3000
  - Username: admin
  - Password: (from GRAFANA_ADMIN_PASSWORD in .env.prod)

- **Prometheus**: http://your-server:9090
- **Kibana**: http://your-server:5601

### 2. Configure Alerts

```bash
# Edit Prometheus alert rules
nano monitoring/alert_rules.yml

# Restart Prometheus to load new rules
docker-compose -f docker-compose.prod.yml restart prometheus
```

### 3. Health Check Endpoints

- **Application Health**: https://mobilespo.co.za/health
- **API Health**: https://mobilespo.co.za/api/v1/health
- **Database Health**: Internal monitoring only

## 🔒 Security Configuration

### 1. Database Security

```bash
# MongoDB security is configured automatically with:
# - Authentication enabled
# - SSL/TLS encryption
# - Role-based access control
# - Audit logging

# Redis security includes:
# - Password authentication
# - Network isolation
# - Memory encryption
```

### 2. Application Security

The application includes:
- **HIPAA-compliant encryption** for health data
- **Rate limiting** to prevent abuse
- **Input sanitization** to prevent injection attacks
- **Audit logging** for compliance
- **Session security** with secure cookies

### 3. Network Security

```bash
# Nginx provides:
# - SSL/TLS termination
# - Rate limiting
# - Security headers
# - DDoS protection
```

## 📦 Backup and Recovery

### 1. Automated Backups

```bash
# Database backups run automatically via cron
# Check backup status
ls -la backups/

# Manual backup
./scripts/deploy.sh backup
```

### 2. Backup to Cloud Storage (Optional)

```bash
# Configure AWS S3 backup in .env.prod
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=mobile-spo-backups

# Backups will automatically sync to S3
```

### 3. Disaster Recovery

```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec mongodb \
  mongorestore --host localhost --port 27017 --gzip --archive < backups/mongodb_backup_YYYYMMDD_HHMMSS.gz
```

## 🔄 Maintenance and Updates

### 1. Application Updates

```bash
# Pull latest code
git pull origin production

# Rebuild and redeploy
./scripts/deploy.sh deploy
```

### 2. Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
./scripts/deploy.sh restart
```

### 3. SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/mobilespo.co.za/fullchain.pem ./nginx/ssl/mobilespo.crt
sudo cp /etc/letsencrypt/live/mobilespo.co.za/privkey.pem ./nginx/ssl/mobilespo.key

# Restart Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
./scripts/deploy.sh logs backend

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

#### 2. Database Connection Issues
```bash
# Check MongoDB logs
./scripts/deploy.sh logs mongodb

# Verify MongoDB is running
docker-compose -f docker-compose.prod.yml exec mongodb mongo --eval "db.adminCommand('ismaster')"
```

#### 3. SSL Certificate Issues
```bash
# Test SSL configuration
openssl s_client -connect mobilespo.co.za:443

# Check certificate expiry
openssl x509 -in nginx/ssl/mobilespo.crt -text -noout | grep "Not After"
```

#### 4. High Memory Usage
```bash
# Check container resource usage
docker stats

# Restart services to free memory
./scripts/deploy.sh restart
```

### Performance Optimization

#### 1. Database Optimization
```bash
# Create database indexes
docker-compose -f docker-compose.prod.yml exec mongodb mongo mobile_spo --eval "
  db.appointments.createIndex({patientId: 1, appointmentDate: 1});
  db.users.createIndex({email: 1});
"
```

#### 2. Cache Optimization
```bash
# Monitor Redis memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory

# Clear cache if needed
docker-compose -f docker-compose.prod.yml exec redis redis-cli flushall
```

## 📞 Support and Maintenance

### Emergency Contacts
- **System Administrator**: admin@mobilespo.co.za
- **Security Team**: security@mobilespo.co.za
- **On-call Support**: +27-XXX-XXX-XXXX

### Monitoring Alerts
- **Critical**: Immediate response required
- **Warning**: Response within 4 hours
- **Info**: Response within 24 hours

### Compliance Requirements
- **HIPAA**: Annual security assessment
- **GDPR**: Data protection impact assessment
- **POPIA**: Information officer reporting

---

**🏥 Mobile Spo Production Deployment - Making healthcare accessible to everyone, everywhere.**
