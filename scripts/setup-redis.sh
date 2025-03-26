#!/bin/bash

# Script to setup Redis for Everleigh
# This script will install Redis (if needed) and update .env.local

echo "=== Everleigh Redis Setup ==="
echo ""

# Generate a secure random password if not provided
if [ -z "$REDIS_PASSWORD" ]; then
    REDIS_PASSWORD=$(openssl rand -base64 24)
    echo "Generated random Redis password"
else
    echo "Using provided Redis password"
fi

# Function to update .env.local file
update_env_file() {
    ENV_FILE=".env.local"
    
    # Check if file exists
    if [ ! -f "$ENV_FILE" ]; then
        echo "Error: $ENV_FILE not found"
        exit 1
    fi
    
    # Check if REDIS_URL already exists
    if grep -q "REDIS_URL" "$ENV_FILE"; then
        # Replace existing REDIS_URL
        sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379|" "$ENV_FILE"
        echo "Updated existing REDIS_URL in $ENV_FILE"
    else
        # Add REDIS_URL to the end of the file
        echo "" >> "$ENV_FILE"
        echo "# Redis Configuration" >> "$ENV_FILE"
        echo "REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379" >> "$ENV_FILE"
        echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> "$ENV_FILE"
        echo "Added Redis configuration to $ENV_FILE"
    fi
}

# Check if docker-compose is installed
if command -v docker-compose &> /dev/null; then
    echo "Docker Compose is installed"
else
    echo "Warning: Docker Compose not found. Please install Docker Compose to use the Redis container."
    echo "For Ubuntu: sudo apt-get install docker-compose"
fi

# Check if Redis is already running in Docker
if docker ps | grep -q "everleigh-redis"; then
    echo "Redis container is already running"
else
    echo "Starting Redis container..."
    
    # Export the password for docker-compose
    export REDIS_PASSWORD
    
    # Start Redis container
    docker-compose -f docker-compose-redis.yml up -d
    
    if [ $? -eq 0 ]; then
        echo "Redis container started successfully"
    else
        echo "Error starting Redis container"
        exit 1
    fi
fi

# Update .env.local with Redis configuration
update_env_file

echo ""
echo "=== Redis Setup Complete ==="
echo "Redis is now configured for Everleigh"
echo "Connection URL: redis://:******@localhost:6379"
echo ""
echo "To start using Redis with Everleigh:"
echo "1. Restart your Next.js application to load the new environment variables"
echo "2. The application will automatically use Redis for caching"
echo "" 