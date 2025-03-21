#!/bin/bash

# MongoDB Server Setup Script for Ubuntu 20.04
# This script installs MongoDB 7.0 with optimized configurations for Everleigh

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting MongoDB 7.0 Installation ==="

# Import MongoDB public GPG key
echo "Importing MongoDB public GPG key..."
sudo apt-get install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file for MongoDB
echo "Creating MongoDB repository list file..."
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update packages list
echo "Updating package lists..."
sudo apt-get update

# Install MongoDB packages
echo "Installing MongoDB packages..."
sudo apt-get install -y mongodb-org

# Create MongoDB configuration directory if it doesn't exist
echo "Creating MongoDB configuration directory..."
sudo mkdir -p /etc/mongod.conf.d

# Backup original configuration file
echo "Backing up original configuration file..."
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# Create optimized MongoDB configuration
echo "Creating optimized MongoDB configuration..."
cat > /tmp/mongod.conf << EOF
# mongod.conf

# for documentation of all options, see:
#   http://docs.mongodb.org/manual/reference/configuration-options/

# Where and how to store data.
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
      journalCompressor: snappy

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1

# how the process runs
processManagement:
  timeZoneInfo: /usr/share/zoneinfo

# security
security:
  authorization: enabled

# set replica set name
#replication:
#  replSetName: "rs0"
EOF

# Apply the new configuration
echo "Applying the new configuration..."
sudo mv /tmp/mongod.conf /etc/mongod.conf

# Enable and start MongoDB service
echo "Enabling and starting MongoDB service..."
sudo systemctl enable mongod
sudo systemctl start mongod

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
sleep 5

# Check MongoDB status
echo "Checking MongoDB status..."
sudo systemctl status mongod

# Create MongoDB admin user
echo "Creating MongoDB admin user..."
# This part should be interactive or use environment variables for security
cat > /tmp/create_admin.js << EOF
use admin;
db.createUser(
  {
    user: "everleighAdmin",
    pwd: "CHANGE_THIS_PASSWORD",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" }, 
             { role: "readWriteAnyDatabase", db: "admin" } ]
  }
);
EOF

# Set proper permissions for the script
chmod 600 /tmp/create_admin.js

echo "===================================================================="
echo "MongoDB installation completed!"
echo ""
echo "IMPORTANT: Before using MongoDB, please run the following command"
echo "to create an admin user for authentication (edit password first):"
echo ""
echo "mongosh < /tmp/create_admin.js"
echo ""
echo "Then update your .env.local file with the new MongoDB connection string:"
echo "MONGODB_URI=mongodb://everleighAdmin:CHANGE_THIS_PASSWORD@127.0.0.1:27017/everleigh?authSource=admin"
echo "===================================================================="

exit 0 