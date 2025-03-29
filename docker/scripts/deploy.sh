#!/bin/bash

# Exit on error
set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/everleigh"
LOG_FILE="/var/log/everleigh/deploy.log"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Create necessary directories
mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    handle_error "Please run as root"
fi

# Backup current state
backup_current_state() {
    log "Creating backup of current state..."
    
    # Backup docker-compose files
    cp docker/docker-compose.yml "$BACKUP_DIR/docker-compose.yml.$TIMESTAMP"
    cp docker/docker-compose.override.yml "$BACKUP_DIR/docker-compose.override.yml.$TIMESTAMP"
    
    # Backup environment files
    cp .env* "$BACKUP_DIR/"
    
    # Backup MongoDB
    ./docker/scripts/backup-mongodb.sh
    
    log "Backup completed successfully"
}

# Pull latest changes
pull_latest_changes() {
    log "Pulling latest changes..."
    git pull origin main || handle_error "Failed to pull latest changes"
}

# Update dependencies
update_dependencies() {
    log "Updating dependencies..."
    docker-compose -f docker/docker-compose.yml run --rm nextjs npm install || \
        handle_error "Failed to update dependencies"
}

# Build and deploy
build_and_deploy() {
    log "Building and deploying services..."
    
    # Stop services gracefully
    docker-compose -f docker/docker-compose.yml down --remove-orphans || \
        handle_error "Failed to stop services"
    
    # Build services
    docker-compose -f docker/docker-compose.yml build --no-cache || \
        handle_error "Failed to build services"
    
    # Start services
    docker-compose -f docker/docker-compose.yml up -d || \
        handle_error "Failed to start services"
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Run health check
    ./docker/scripts/healthcheck.sh || \
        handle_error "Health check failed"
    
    log "Deployment completed successfully"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    find "$BACKUP_DIR" -type f -mtime +7 -delete || \
        handle_error "Failed to clean up old backups"
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    # Backup current state
    backup_current_state
    
    # Pull latest changes
    pull_latest_changes
    
    # Update dependencies
    update_dependencies
    
    # Build and deploy
    build_and_deploy
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Deployment completed successfully"
}

# Run main function
main 