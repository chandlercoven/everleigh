#!/bin/bash

# Everleigh Cron Jobs Setup Script
# This script sets up cron jobs for maintenance tasks

# Exit immediately if a command exits with a non-zero status
set -e

echo "Setting up cron jobs for Everleigh maintenance..."

# Create temp crontab file
TEMP_CRONTAB_FILE="/tmp/everleigh_crontab"
crontab -l > $TEMP_CRONTAB_FILE 2>/dev/null || echo "# Everleigh cron jobs" > $TEMP_CRONTAB_FILE

# Add MongoDB backup job - runs at 2 AM every day
if ! grep -q "backup-mongodb.sh" $TEMP_CRONTAB_FILE; then
  echo "Adding MongoDB backup job..."
  echo "0 2 * * * /var/www/html/everleigh/scripts/backup-mongodb.sh >> /var/log/mongodb_backup.log 2>&1" >> $TEMP_CRONTAB_FILE
fi

# Add MongoDB index check job - runs at 3 AM every Sunday
if ! grep -q "setup-mongodb-indexes.js" $TEMP_CRONTAB_FILE; then
  echo "Adding MongoDB index check job..."
  echo "0 3 * * 0 mongosh /var/www/html/everleigh/scripts/setup-mongodb-indexes.js >> /var/log/mongodb_index_check.log 2>&1" >> $TEMP_CRONTAB_FILE
fi

# Add system update job - runs at 4 AM every Sunday
if ! grep -q "apt-get update" $TEMP_CRONTAB_FILE; then
  echo "Adding system update job..."
  echo "0 4 * * 0 sudo apt-get update && sudo apt-get upgrade -y >> /var/log/system_update.log 2>&1" >> $TEMP_CRONTAB_FILE
fi

# Add Let's Encrypt renewal job - runs at 3 AM every Monday
if ! grep -q "certbot renew" $TEMP_CRONTAB_FILE; then
  echo "Adding Let's Encrypt renewal job..."
  echo "0 3 * * 1 sudo certbot renew --quiet >> /var/log/letsencrypt_renewal.log 2>&1" >> $TEMP_CRONTAB_FILE
fi

# Add log rotation job - runs at 5 AM every day
if ! grep -q "logrotate" $TEMP_CRONTAB_FILE; then
  echo "Adding log rotation job..."
  echo "0 5 * * * sudo logrotate /etc/logrotate.d/everleigh >> /var/log/logrotate.log 2>&1" >> $TEMP_CRONTAB_FILE
fi

# Install the new crontab
echo "Installing new crontab..."
crontab $TEMP_CRONTAB_FILE
rm $TEMP_CRONTAB_FILE

# Create logrotate configuration
echo "Creating logrotate configuration..."
LOGROTATE_CONFIG="/etc/logrotate.d/everleigh"

sudo tee $LOGROTATE_CONFIG > /dev/null << EOF
/var/log/mongodb_backup.log
/var/log/mongodb_index_check.log
/var/log/system_update.log
/var/log/letsencrypt_renewal.log
/var/log/logrotate.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root adm
    sharedscripts
    postrotate
        systemctl reload rsyslog >/dev/null 2>&1 || true
    endscript
}
EOF

echo "Cron jobs setup completed!"
echo
echo "The following jobs have been installed:"
echo " - MongoDB backup: Daily at 2 AM"
echo " - MongoDB index check: Weekly on Sundays at 3 AM"
echo " - System updates: Weekly on Sundays at 4 AM"
echo " - Let's Encrypt renewal: Weekly on Mondays at 3 AM"
echo " - Log rotation: Daily at 5 AM"
echo
echo "Logs will be rotated daily and kept for 14 days"

exit 0 