#!/bin/bash

# Exit on error
set -e

echo "🔍 Verifying TypeScript configuration..."
npx tsc --noEmit

echo "🧹 Cleaning up any previous build artifacts..."
npm run clean

echo "🔨 Building Docker image..."
docker build -t everleigh:latest .

echo "✅ Build successful!"
echo "📋 Image details:"
docker image ls everleigh:latest

echo "🧪 Running a test container to verify..."
docker run --rm -d --name everleigh-test -p 3001:3001 everleigh:latest

echo "⏳ Waiting for application to start..."
sleep 10

echo "🔍 Testing API health endpoint..."
if curl -s http://localhost:3001/api/ping | grep -q '"status":"healthy"'; then
  echo "✅ Health check successful!"
else
  echo "❌ Health check failed!"
  docker logs everleigh-test
  docker stop everleigh-test
  exit 1
fi

echo "🛑 Stopping test container..."
docker stop everleigh-test

echo "🎉 Docker image built and verified successfully!"
echo "To run the container: docker run -p 3001:3001 everleigh:latest" 