#!/bin/bash

# Everleigh Voice AI - Production Startup Script
# This script starts the application in production mode using PM2

# Change to the project directory (if running from elsewhere)
cd "$(dirname "$0")/.." || exit

echo "🚀 Starting Everleigh in production mode..."

# Check for PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing globally..."
    npm install -g pm2
fi

# Check if ecosystem config exists
if [ ! -f "ecosystem.config.cjs" ]; then
    echo "❌ ecosystem.config.cjs not found!"
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️ Warning: .env.local file not found. Make sure environment variables are configured."
fi

# Build the application if needed
if [ "$1" == "--build" ] || [ ! -d ".next" ]; then
    echo "🏗️ Building the application..."
    npm run build
fi

# Start the application with PM2
echo "🌐 Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Display running processes
echo "✅ Everleigh is now running in production mode."
pm2 list

echo "📊 To monitor the application, run: pm2 monit"
echo "📜 To view logs, run: pm2 logs everleigh" 