#!/bin/bash

# This script optimizes the Docker build for the Everleigh application
# Run with sudo: sudo bash optimize-docker.sh

set -e

echo "🔧 Optimizing Docker build for Everleigh..."

# Create the optimized Dockerfile
cat > Dockerfile.optimized << EOL
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
# Use legacy-peer-deps to handle dependency conflicts
RUN npm ci --only=production --no-audit --no-fund --legacy-peer-deps

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Use the standalone output from the pre-built Next.js app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Final stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV PORT 3001
ENV NEXT_TELEMETRY_DISABLED 1

# Install only the necessary tools
RUN apk add --no-cache curl dumb-init

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nextjs

# Copy from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/ ./

# Set proper permissions
RUN chmod 755 /app && \\
    find /app -type d -exec chmod 755 {} \\; || true && \\
    find /app -type f -exec chmod 644 {} \\; || true && \\
    chmod 755 /app/server.js || echo "Warning: server.js not found"

# Switch to non-root user
USER nextjs

EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
  CMD curl -sf http://localhost:3001/api/ping || exit 1

# Use dumb-init as PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
EOL

echo "📝 Created optimized Dockerfile.optimized"

# Build using the optimized Dockerfile
echo "🔨 Building optimized Docker image..."
docker build -f Dockerfile.optimized -t everleigh_nextjs:optimized .

echo "✅ Build successful!"
echo "📋 Image details:"
docker image ls everleigh_nextjs:optimized

echo "🧪 Running a test container to verify..."
docker run --rm -d --name everleigh-optimized-test -p 3010:3001 everleigh_nextjs:optimized

echo "⏳ Waiting for application to start (15 seconds)..."
sleep 15

echo "🔍 Testing API health endpoint..."
if curl -sf http://localhost:3010/api/ping; then
  echo "✅ Health check successful!"
else
  echo "❌ Health check failed! Checking container logs:"
  docker logs everleigh-optimized-test
  docker stop everleigh-optimized-test || true
  exit 1
fi

echo "🛑 Stopping test container..."
docker stop everleigh-optimized-test

echo "🎉 Optimized Docker image built and verified successfully!"
echo "Original image size: $(docker image ls everleigh_nextjs:production --format '{{.Size}}')"
echo "Optimized image size: $(docker image ls everleigh_nextjs:optimized --format '{{.Size}}')"
echo "To run the container: docker run -p 3001:3001 everleigh_nextjs:optimized" 