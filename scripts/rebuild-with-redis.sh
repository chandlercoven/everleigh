#!/bin/bash
# Script to rebuild the application with the improved Redis configuration
# This script should be run on the production server

# Set the working directory
cd "$(dirname "$0")/.."

# Ensure we're in the project root
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root directory"
  exit 1
fi

# Print useful information
echo "===== Everleigh Redis Rebuild ====="
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Docker version: $(docker -v 2>/dev/null || echo 'Docker not installed')"
echo "=============================="
echo

# Step 1: Verify environment files
echo "Step 1: Checking environment configuration..."
if [ ! -f ".env.local" ]; then
  echo "Error: .env.local file not found"
  exit 1
fi

# Check Redis configuration
REDIS_URL=$(grep REDIS_URL .env.local | cut -d '=' -f2)
DISABLE_REDIS=$(grep DISABLE_REDIS .env.local | cut -d '=' -f2)

echo "Current Redis URL: $REDIS_URL"
echo "Redis disabled: $DISABLE_REDIS"

# Update Redis configuration if needed
if [[ "$REDIS_URL" == *"localhost"* ]]; then
  echo "Updating Redis URL to point to Docker container..."
  sed -i 's|REDIS_URL=redis://localhost:6379|REDIS_URL=redis://redis:6379|g' .env.local
fi

if [[ "$DISABLE_REDIS" == "true" ]]; then
  echo "Enabling Redis by setting DISABLE_REDIS=false..."
  sed -i 's|DISABLE_REDIS=true|DISABLE_REDIS=false|g' .env.local
  
  # Also update docker-compose.yml if it exists
  if [ -f "docker-compose.yml" ]; then
    sed -i 's|- DISABLE_REDIS=true|- DISABLE_REDIS=false|g' docker-compose.yml
  fi
fi

# Step 2: Install dependencies
echo
echo "Step 2: Installing dependencies..."
npm ci

# Step 3: Check if Redis is accessible
echo
echo "Step 3: Checking Redis connectivity..."
# Try to reach Redis
if command -v redis-cli &> /dev/null; then
  if redis-cli -h redis ping > /dev/null 2>&1; then
    echo "Redis is accessible at hostname 'redis'"
  elif redis-cli ping > /dev/null 2>&1; then
    echo "Redis is accessible on localhost"
  else
    echo "Warning: Could not connect to Redis"
    echo "Please ensure Redis is running and accessible from this machine"
  fi
else
  echo "Redis CLI not available, skipping direct Redis check"
fi

# Step 4: Build the application
echo
echo "Step 4: Building the application with improved Redis configuration..."
NODE_ENV=production npm run build

# Step 5: Update PM2 configuration
echo
echo "Step 5: Updating PM2 configuration..."
if [ -f "ecosystem.config.cjs" ]; then
  # Check if PM2 is running
  if command -v pm2 &> /dev/null; then
    echo "Stopping the current PM2 process..."
    pm2 stop everleigh 2>/dev/null || true
    
    echo "Starting the application with the new configuration..."
    pm2 start ecosystem.config.cjs
    
    echo "Saving PM2 configuration..."
    pm2 save
    
    echo "Application successfully restarted with PM2"
  else
    echo "PM2 not found, skipping PM2 update"
  fi
else
  echo "No ecosystem.config.cjs file found, skipping PM2 update"
fi

# Step 6: Docker handling (if applicable)
if [ -f "docker-compose.yml" ]; then
  echo
  echo "Step 6: Updating Docker containers..."
  
  if command -v docker-compose &> /dev/null; then
    echo "Rebuilding and restarting Docker containers..."
    docker-compose down
    docker-compose up -d --build
    
    echo "Docker containers updated successfully"
  else
    echo "Docker Compose not found, skipping Docker update"
  fi
else
  echo
  echo "Step 6: No docker-compose.yml file found, skipping Docker update"
fi

# Step 7: Run the API health check
echo
echo "Step 7: Running API health check..."
if [ -f "scripts/check-api.js" ]; then
  echo "Waiting for services to start..."
  sleep 10
  
  echo "Running API health check..."
  node scripts/check-api.js
  
  if [ $? -eq 0 ]; then
    echo "API health check passed!"
  else
    echo "Warning: API health check failed"
    echo "Please check the logs for more details"
  fi
else
  echo "No API health check script found, skipping check"
fi

echo
echo "===== Redis Configuration Rebuild Complete ====="
echo "The application has been rebuilt with the improved Redis configuration."
echo "You can monitor the logs with:"
echo "  pm2 logs everleigh"
echo "Or if using Docker:"
echo "  docker-compose logs -f nextjs"
echo 