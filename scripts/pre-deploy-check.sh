#!/bin/bash

# Pre-deployment check script for Everleigh
# This script validates API keys and environment variables before deployment

# Exit on error
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${GREEN}=== Everleigh Pre-Deployment Check ===${NC}"

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
  echo "${RED}Error: This script must be run from the project root directory${NC}"
  exit 1
fi

# Check for required environment variables
echo "${GREEN}Checking environment files...${NC}"

ENV_FILE="config/env/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "${RED}Error: $ENV_FILE not found. Cannot deploy without environment configuration.${NC}"
  exit 1
else
  echo "${GREEN}Found environment file: $ENV_FILE${NC}"
  
  # Check for required environment variables
  REQUIRED_VARS=("OPENAI_API_KEY" "MONGODB_URI" "REDIS_URL" "NEXTAUTH_SECRET")
  MISSING_VARS=0
  
  for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "${var}=" "$ENV_FILE" || grep -q "${var}=$" "$ENV_FILE"; then
      echo "${RED}Error: $var is not set in $ENV_FILE${NC}"
      MISSING_VARS=$((MISSING_VARS + 1))
    else
      echo "${GREEN}✓ $var is set${NC}"
    fi
  done
  
  # Check for placeholder values
  if grep -q "your-api-key\|change-this-in-production\|dummy" "$ENV_FILE"; then
    echo "${RED}Error: $ENV_FILE contains placeholder values that must be changed for production${NC}"
    grep -n "your-api-key\|change-this-in-production\|dummy" "$ENV_FILE"
    MISSING_VARS=$((MISSING_VARS + 1))
  fi
  
  if [ $MISSING_VARS -gt 0 ]; then
    echo "${RED}Found $MISSING_VARS issues with environment variables. Cannot proceed.${NC}"
    exit 1
  fi
fi

# Validate API keys
echo "${GREEN}Validating API keys...${NC}"
node scripts/validation/validate-api-keys.js --exit-on-fail

# This will exit with an error code if the API keys are invalid
# The --exit-on-fail flag ensures the script exits with an error code if validation fails

echo ""
echo "${GREEN}=== Pre-Deployment Check Passed ===${NC}"
echo ""
echo "All environment variables and API keys are valid."
echo "You can proceed with deployment."
echo ""
echo "To deploy the application:"
echo "  docker-compose -f docker/docker-compose.yml up -d" 