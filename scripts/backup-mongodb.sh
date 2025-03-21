#!/bin/bash

# MongoDB Backup Script for Everleigh
# This script creates a backup of the MongoDB database

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="/var/log/mongodb_backup.log"
RETENTION_DAYS=7
MONGODB_USER="everleighAdmin"
MONGODB_PASS="CHANGE_THIS_PASSWORD"
MONGODB_HOST="127.0.0.1"
MONGODB_PORT="27017"
MONGODB_DB="everleigh"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Log function
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a $LOG_FILE
}

log "=== Starting MongoDB backup ==="

# Create the backup
log "Creating backup for database: $MONGODB_DB"
BACKUP_FILENAME="${BACKUP_DIR}/${MONGODB_DB}_${TIMESTAMP}.gz"

if mongodump --host $MONGODB_HOST --port $MONGODB_PORT --username $MONGODB_USER --password $MONGODB_PASS --authenticationDatabase admin --db $MONGODB_DB --gzip --archive=$BACKUP_FILENAME; then
  log "Backup completed successfully: $BACKUP_FILENAME"
  log "Backup size: $(du -h $BACKUP_FILENAME | cut -f1)"
else
  log "ERROR: Backup failed!"
  exit 1
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days"
find $BACKUP_DIR -name "${MONGODB_DB}_*.gz" -mtime +$RETENTION_DAYS -delete
log "Cleanup completed"

# Create a symlink to the latest backup
ln -sf $BACKUP_FILENAME $BACKUP_DIR/latest_backup.gz

log "=== MongoDB backup completed ==="

# Optional: Send notification about the backup
# mail -s "MongoDB Backup Completed" admin@example.com < $LOG_FILE

exit 0 