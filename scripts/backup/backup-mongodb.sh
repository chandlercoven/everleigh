#!/bin/bash

# Exit on error
set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Check if MongoDB container is running
if ! docker-compose ps mongodb | grep -q "Up"; then
    handle_error "MongoDB container is not running"
fi

# Perform backup
log "Starting MongoDB backup..."
docker-compose exec -T mongodb mongodump \
    --host localhost \
    --port 27017 \
    --username "$MONGO_USERNAME" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --db everleigh \
    --out "/data/db/backup_$TIMESTAMP" || handle_error "MongoDB backup failed"

# Copy backup from container to host
log "Copying backup from container..."
docker cp "$(docker-compose ps -q mongodb):/data/db/backup_$TIMESTAMP" "$BACKUP_DIR/" || \
    handle_error "Failed to copy backup from container"

# Clean up backup in container
log "Cleaning up container backup..."
docker-compose exec -T mongodb rm -rf "/data/db/backup_$TIMESTAMP" || \
    handle_error "Failed to clean up container backup"

# Compress backup
log "Compressing backup..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP" || \
    handle_error "Failed to compress backup"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"

# Clean up old backups
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete || \
    handle_error "Failed to clean up old backups"

log "Backup completed successfully: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz" 