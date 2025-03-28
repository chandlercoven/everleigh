#!/bin/bash

# Exit on error
set -e

echo "🧪 Building production Docker image with TypeScript migration accommodations..."

echo "🧹 Cleaning up any previous build artifacts..."
npm run clean || true

echo "🔨 Building Docker image..."
# Pass build args to skip strict TypeScript checking during migration
docker build \
  --build-arg SKIP_TS_CHECK=true \
  --build-arg NODE_ENV=production \
  -t everleigh:production .

echo "✅ Build successful!"
echo "📋 Image details:"
docker image ls everleigh:production

echo "🧪 Running a test container to verify..."
docker run --rm -d --name everleigh-test -p 3001:3001 everleigh:production

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

echo "🎉 Production Docker image built and verified successfully!"
echo "To run the container: docker run -p 3001:3001 everleigh:production" 