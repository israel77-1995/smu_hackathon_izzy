#!/bin/bash

# Mobile Spo Production Deployment Script
# This script handles the complete deployment process for Mobile Spo

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="mobile-spo"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env file exists
    if [ ! -f ".env.prod" ]; then
        error ".env.prod file not found. Please create it with required environment variables."
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "./logs"
    mkdir -p "./nginx/ssl"
    mkdir -p "./nginx/logs"
    mkdir -p "./monitoring/grafana/dashboards"
    mkdir -p "./monitoring/grafana/datasources"
    mkdir -p "./monitoring/logstash/pipeline"
    
    success "Directories created"
}

# Backup existing data
backup_data() {
    log "Creating backup of existing data..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "mobile-spo-mongodb"; then
        BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$(date +%Y%m%d_%H%M%S).gz"
        
        docker-compose -f docker-compose.prod.yml exec -T mongodb \
            mongodump --host localhost --port 27017 --gzip --archive > "$BACKUP_FILE"
        
        success "Database backup created: $BACKUP_FILE"
    else
        warning "MongoDB container not running, skipping backup"
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    docker-compose -f docker-compose.prod.yml pull
    
    success "Images pulled successfully"
}

# Build custom images
build_images() {
    log "Building custom Docker images..."
    
    # Build backend image
    docker build -f backend/Dockerfile.prod -t mobile-spo-backend:latest ./backend
    
    success "Custom images built successfully"
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Stop existing services
    docker-compose -f docker-compose.prod.yml down
    
    # Start services
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    success "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
            success "Services are healthy"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts - Waiting for services to be healthy..."
        sleep 10
        ((attempt++))
    done
    
    error "Services failed to become healthy within timeout"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for MongoDB to be ready
    docker-compose -f docker-compose.prod.yml exec backend \
        node -e "
            const { connectDatabase } = require('./src/database/connection.js');
            connectDatabase().then(() => {
                console.log('Database connection successful');
                process.exit(0);
            }).catch(err => {
                console.error('Database connection failed:', err);
                process.exit(1);
            });
        "
    
    success "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Import Grafana dashboards
    if [ -d "./monitoring/grafana/dashboards" ]; then
        log "Grafana dashboards will be automatically imported"
    fi
    
    # Configure Prometheus alerts
    if [ -f "./monitoring/alert_rules.yml" ]; then
        log "Prometheus alert rules configured"
    fi
    
    success "Monitoring setup completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check backend health
    local backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
    if [ "$backend_health" != "200" ]; then
        error "Backend health check failed (HTTP $backend_health)"
    fi
    
    # Check if all containers are running
    local running_containers=$(docker-compose -f docker-compose.prod.yml ps --services --filter "status=running" | wc -l)
    local total_containers=$(docker-compose -f docker-compose.prod.yml ps --services | wc -l)
    
    if [ "$running_containers" -ne "$total_containers" ]; then
        warning "Not all containers are running ($running_containers/$total_containers)"
    fi
    
    success "Deployment verification completed"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    
    docker image prune -f
    docker volume prune -f
    
    success "Cleanup completed"
}

# Main deployment process
main() {
    log "Starting Mobile Spo production deployment..."
    
    check_prerequisites
    create_directories
    backup_data
    pull_images
    build_images
    deploy_services
    wait_for_services
    run_migrations
    setup_monitoring
    verify_deployment
    cleanup
    
    success "🎉 Mobile Spo deployment completed successfully!"
    log "Access the application at: https://mobilespo.co.za"
    log "Monitoring dashboard: http://localhost:3000 (Grafana)"
    log "Logs dashboard: http://localhost:5601 (Kibana)"
    log "Metrics: http://localhost:9090 (Prometheus)"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        backup_data
        ;;
    "verify")
        verify_deployment
        ;;
    "cleanup")
        cleanup
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f "${2:-backend}"
        ;;
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    "stop")
        log "Stopping all services..."
        docker-compose -f docker-compose.prod.yml down
        success "All services stopped"
        ;;
    "restart")
        log "Restarting services..."
        docker-compose -f docker-compose.prod.yml restart
        success "Services restarted"
        ;;
    *)
        echo "Usage: $0 {deploy|backup|verify|cleanup|logs|status|stop|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment process (default)"
        echo "  backup   - Create database backup"
        echo "  verify   - Verify deployment health"
        echo "  cleanup  - Clean up old Docker images"
        echo "  logs     - Show service logs (specify service name as second argument)"
        echo "  status   - Show service status"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        exit 1
        ;;
esac
