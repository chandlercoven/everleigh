#!/bin/bash

# LiveKit Server Setup Script for Ubuntu 22.04
# This script sets up LiveKit server using Docker for evaluation

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting LiveKit Server Setup ==="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is required but not installed. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
fi

# Create LiveKit configuration directory
echo "Creating LiveKit configuration directory..."
mkdir -p ~/livekit-config

# Generate a random API key and secret
API_KEY="everleigh_$(openssl rand -hex 8)"
API_SECRET="$(openssl rand -hex 32)"

# Create LiveKit configuration file
echo "Creating LiveKit configuration file..."
cat > ~/livekit-config/config.yaml << EOF
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 50100
  tcp_port: 7881
  udp_port: 7882
keys:
  ${API_KEY}: ${API_SECRET}
logging:
  json: false
  level: info
redis:
  address: localhost:6379
  db: 0
EOF

# Set proper permissions for configuration file
chmod 600 ~/livekit-config/config.yaml

# Create Docker Compose file for LiveKit
echo "Creating Docker Compose file for LiveKit..."
cat > ~/livekit-config/docker-compose.yml << EOF
version: '3'
services:
  livekit:
    image: livekit/livekit-server:latest
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
      - "50000-50100:50000-50100/udp"
    volumes:
      - ./config.yaml:/config.yaml
    command: --config /config.yaml
    restart: unless-stopped
    network_mode: "host"
EOF

# Start LiveKit Docker container
echo "Starting LiveKit Docker container..."
cd ~/livekit-config
docker-compose up -d

# Wait for LiveKit to start
echo "Waiting for LiveKit to start..."
sleep 5

# Check LiveKit container status
echo "Checking LiveKit container status..."
docker ps | grep livekit

echo "===================================================================="
echo "LiveKit Server installation completed!"
echo ""
echo "Server URL: ws://$(hostname -I | awk '{print $1}'):7880"
echo "API Key: $API_KEY"
echo "API Secret: $API_SECRET"
echo ""
echo "IMPORTANT: Update your .env.local file with these credentials:"
echo "NEXT_PUBLIC_LIVEKIT_URL=ws://$(hostname -I | awk '{print $1}'):7880"
echo "LIVEKIT_API_KEY=$API_KEY"
echo "LIVEKIT_API_SECRET=$API_SECRET"
echo "LIVEKIT_API_URL=http://$(hostname -I | awk '{print $1}'):7880"
echo ""
echo "For production use, consider setting up a reverse proxy with SSL"
echo "===================================================================="

exit 0 