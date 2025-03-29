#!/bin/bash

# Exit on error
set -e

echo "🧪 Building production Docker image (TypeScript Migration Compatible)..."

echo "🧹 Cleaning up any previous build artifacts..."
npm run clean || true

echo "🔨 Building Next.js application locally first..."
# Next.js build with TypeScript checks disabled via next.config.mjs
npm run build

echo "✅ Local build successful! Now packaging into Docker..."

# Create a multi-stage Dockerfile for production that uses pre-built Next.js app
cat > Dockerfile.prod << EOL
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

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

echo "📝 Created production Dockerfile with multi-stage builds for optimization"

# Build the Docker image using the pre-built Next.js app
echo "🔨 Building Docker image from pre-built Next.js app..."
docker build -f Dockerfile.prod -t everleigh_nextjs:production .

echo "✅ Build successful!"
echo "📋 Image details:"
docker image ls everleigh_nextjs:production

echo "🧪 Running a test container to verify..."
docker run --rm -d --name everleigh-test -p 3010:3001 everleigh_nextjs:production

echo "⏳ Waiting for application to start (15 seconds)..."
sleep 15

echo "🔍 Testing API health endpoint..."
if curl -sf http://localhost:3010/api/ping; then
  echo "✅ Health check successful!"
else
  echo "❌ Health check failed! Checking container logs:"
  docker logs everleigh-test
  docker stop everleigh-test || true
  exit 1
fi

echo "🛑 Stopping test container..."
docker stop everleigh-test

echo "🎉 Production Docker image built and verified successfully!"
echo "To run the container: docker run -p 3001:3001 everleigh_nextjs:production" 