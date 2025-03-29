#!/bin/bash

# n8n Setup Script for Ubuntu 20.04
# This script installs n8n globally and sets it up as a systemd service

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting n8n Installation and Setup ==="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Using Node.js version: $NODE_VERSION"

# Install n8n globally
echo "Installing n8n globally..."
sudo npm install -g n8n

# Create n8n configuration directory
echo "Creating n8n configuration directory..."
mkdir -p ~/.n8n

# Create n8n environment file
echo "Creating n8n environment configuration..."
cat > ~/.n8n/.env << EOF
# n8n Environment Configuration

# Basic configuration
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_HOST=localhost
N8N_PATH=/
N8N_USER_FOLDER=/root/.n8n

# Database configuration (using MongoDB)
DB_TYPE=mongodb
DB_MONGODB_CONNECTION_URL=mongodb://everleighAdmin:EverleighAdmin2685a57376c7f8ab@127.0.0.1:27017/n8n?authSource=admin

# Security settings
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=EverleighN8n$(openssl rand -hex 6)

# Execution settings
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_ON_PROGRESS=true
EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true

# Workflow settings
WORKFLOWS_DEFAULT_NAME=My workflow
WORKFLOW_ENABLE_STATUS_CHANGE_HOOKS=true

# Logs
N8N_LOG_LEVEL=info
EOF

# Set proper permissions for the environment file
chmod 600 ~/.n8n/.env

# Create systemd service file
echo "Creating systemd service file for n8n..."
cat > /tmp/n8n.service << EOF
[Unit]
Description=n8n workflow automation
After=network.target mongodb.service
Wants=mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/n8n start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=N8N_CONFIG_FILES=/root/.n8n/.env

[Install]
WantedBy=multi-user.target
EOF

# Install the systemd service file
sudo mv /tmp/n8n.service /etc/systemd/system/n8n.service

# Reload systemd daemon
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable and start n8n service
echo "Enabling and starting n8n service..."
sudo systemctl enable n8n
sudo systemctl start n8n

# Wait for n8n to start
echo "Waiting for n8n to start..."
sleep 10

# Check n8n status
echo "Checking n8n service status..."
sudo systemctl status n8n

echo "===================================================================="
echo "n8n installation completed!"
echo ""
echo "IMPORTANT: n8n credentials:"
echo "Username: admin"
echo "Password: $(grep N8N_BASIC_AUTH_PASSWORD ~/.n8n/.env | cut -d= -f2)"
echo ""
echo "n8n should be available at: http://localhost:5678"
echo ""
echo "To use n8n behind a reverse proxy, configure Nginx with the following:"
echo "- Proxy pass to: http://localhost:5678"
echo "- Ensure WebSocket support is enabled"
echo "===================================================================="

exit 0 