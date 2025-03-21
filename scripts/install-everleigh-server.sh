#!/bin/bash

# Everleigh Server Installation Script
# This script runs all the necessary installation steps for Everleigh self-hosting

# Exit immediately if a command exits with a non-zero status
set -e

# Variables that can be customized
EVERLEIGH_DIR="/var/www/html/everleigh"
MONGODB_DIR="$HOME/mongodb"
N8N_DIR="$HOME/n8n"
LIVEKIT_DIR="$HOME/livekit"

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Everleigh Server Installation${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo
echo -e "${YELLOW}This script will install and configure the following components:${NC}"
echo "1. MongoDB database server"
echo "2. n8n workflow automation"
echo "3. LiveKit real-time communication server"
echo "4. Nginx as a reverse proxy with SSL"
echo
echo -e "${YELLOW}Installation Directory: ${EVERLEIGH_DIR}${NC}"
echo

# Confirm before proceeding
read -p "Do you want to proceed with the installation? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation aborted."
    exit 1
fi

# Update system packages
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Updating system packages...${NC}"
echo -e "${BLUE}===================================================================${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install basic dependencies
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Installing basic dependencies...${NC}"
echo -e "${BLUE}===================================================================${NC}"
sudo apt-get install -y curl git build-essential openssl libssl-dev nginx certbot python3-certbot-nginx

# Create directories if they don't exist
mkdir -p $MONGODB_DIR
mkdir -p $N8N_DIR
mkdir -p $LIVEKIT_DIR

# Install MongoDB
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Installing MongoDB...${NC}"
echo -e "${BLUE}===================================================================${NC}"
chmod +x scripts/setup-mongodb.sh
./scripts/setup-mongodb.sh

# Wait for MongoDB to fully initialize
echo "Waiting for MongoDB to initialize..."
sleep 10

# Install n8n
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Installing n8n...${NC}"
echo -e "${BLUE}===================================================================${NC}"
chmod +x scripts/setup-n8n.sh
./scripts/setup-n8n.sh

# Install LiveKit
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Installing LiveKit...${NC}"
echo -e "${BLUE}===================================================================${NC}"
chmod +x scripts/setup-livekit.sh
./scripts/setup-livekit.sh

# Set up Nginx reverse proxy
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Setting up Nginx reverse proxy...${NC}"
echo -e "${BLUE}===================================================================${NC}"
chmod +x scripts/setup-nginx.sh
./scripts/setup-nginx.sh

# Import n8n workflow templates
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Importing n8n workflow templates...${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo "To import workflows into n8n, navigate to the n8n web interface and use the import feature."
echo "Workflow templates are located in: ./scripts/n8n-workflow-templates/"

# Final steps
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Installation Completed!${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo
echo -e "${YELLOW}Here's what you need to do next:${NC}"
echo
echo "1. Update MongoDB credentials:"
echo "   - Edit ~/.n8n/.env to update the MongoDB connection string"
echo "   - Use the created admin credentials from the MongoDB setup"
echo
echo "2. Configure LiveKit:"
echo "   - Update the API keys in your .env.local file from the generated credentials"
echo
echo "3. Import n8n workflows:"
echo "   - Navigate to n8n web interface"
echo "   - Import the workflow templates from ./scripts/n8n-workflow-templates/"
echo
echo "4. Configure your domain names in Nginx:"
echo "   - The Nginx configuration files are in /etc/nginx/sites-available/"
echo
echo "5. Restart all services:"
echo "   sudo systemctl restart nginx mongod n8n"
echo
echo -e "${GREEN}Thank you for installing Everleigh!${NC}"
echo

exit 0 