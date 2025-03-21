#!/bin/bash

# Production startup script for Everleigh Voice AI
echo "Starting Everleigh Voice AI in production mode..."

# Navigate to project directory
cd /var/www/html/everleigh

# Build the Next.js application
echo "Building application..."
npm run build

# Start the application using PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs

echo "Everleigh Voice AI is now running in production mode."
echo "To check status, run: pm2 status"
echo "To view logs, run: pm2 logs" 