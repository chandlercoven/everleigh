#!/bin/bash

# Production build script for Everleigh
# This script handles building and deploying the application for production

# Exit on error
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${GREEN}=== Everleigh Production Build ===${NC}"

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
  echo "${RED}Error: This script must be run from the project root directory${NC}"
  exit 1
fi

# Check if Docker is available
if ! command -v docker &>/dev/null; then
  echo "${RED}Error: Docker is not installed or not in the PATH${NC}"
  exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &>/dev/null; then
  echo "${RED}Error: docker-compose is not installed or not in the PATH${NC}"
  exit 1
fi

# Check for required environment variables
echo "${GREEN}Checking environment files...${NC}"

ENV_FILE="config/env/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "${YELLOW}Warning: $ENV_FILE not found${NC}"
  echo "${YELLOW}Creating a symlink from .env.example${NC}"
  
  # Create directory if it doesn't exist
  mkdir -p config/env
  
  # Link example file if environment file doesn't exist
  if [ -f "config/env/.env.example" ]; then
    cp config/env/.env.example "$ENV_FILE"
    echo "${YELLOW}Copied .env.example to $ENV_FILE${NC}"
    echo "${YELLOW}Please update $ENV_FILE with your production values${NC}"
  else
    echo "${RED}Error: No .env.example file found. Cannot create environment file.${NC}"
    exit 1
  fi
else
  echo "${GREEN}Found environment file: $ENV_FILE${NC}"
  
  # Check for placeholder values that should be changed
  if grep -q "your-api-key\|change-this-in-production\|dummy" "$ENV_FILE"; then
    echo "${YELLOW}Warning: $ENV_FILE contains placeholder values that should be changed for production${NC}"
  fi
fi

# Validate API keys
echo "${GREEN}Validating API keys...${NC}"
node scripts/validation/validate-api-keys.js

if [ $? -ne 0 ]; then
  echo "${YELLOW}API key validation found issues. Continuing anyway, but this should be fixed for production.${NC}"
  read -p "Press Enter to continue or Ctrl+C to cancel..."
fi

# Build the Docker images
echo "${GREEN}Building Docker images...${NC}"
docker-compose -f docker/docker-compose.yml build

# Show deployment instructions
echo ""
echo "${GREEN}=== Build Complete ===${NC}"
echo ""
echo "To start the production environment:"
echo "  docker-compose -f docker/docker-compose.yml up -d"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker/docker-compose.yml logs -f"
echo ""
echo "To stop the production environment:"
echo "  docker-compose -f docker/docker-compose.yml down"
echo ""
echo "${YELLOW}Important:${NC} Make sure your production environment variables are correctly set in $ENV_FILE"
echo "           and that you have valid API keys before deploying to production."
echo ""
echo "${GREEN}Thank you for using Everleigh!${NC}" 