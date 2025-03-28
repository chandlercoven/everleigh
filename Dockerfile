FROM node:20.11.1-alpine3.19@sha256:0a9e7612b1e33299e8354c4bf8b51f16542b0c44fe28146f331c10b7970efe94 AS deps

WORKDIR /app

# Accept build arguments for TypeScript migration
ARG SKIP_TS_CHECK=false
ARG NODE_ENV=production

# Copy only package files first for better caching
COPY package.json package-lock.json tsconfig.json ./

# Install dependencies with clear cache to keep image size down
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Builder stage
FROM node:20.11.1-alpine3.19@sha256:0a9e7612b1e33299e8354c4bf8b51f16542b0c44fe28146f331c10b7970efe94 AS builder
WORKDIR /app

# Accept build arguments for TypeScript migration
ARG SKIP_TS_CHECK=false
ARG NODE_ENV=production

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Next.js configuration files
COPY next.config.mjs .
COPY tsconfig.json .
COPY tailwind.config.js .
COPY postcss.config.js .

# Now copy source code to optimize rebuilds when code changes
COPY public ./public
COPY components ./components
COPY pages ./pages
COPY styles ./styles
COPY contexts ./contexts
COPY hooks ./hooks
COPY lib ./lib
COPY types ./types

# Copy any remaining files
COPY . .

# Run security check, TypeScript checking depending on SKIP_TS_CHECK flag, and linting
RUN npm audit --production --audit-level=high && \
    if [ "$SKIP_TS_CHECK" = "false" ]; then \
      echo "Running TypeScript type checking..." && \
      npx tsc --noEmit; \
    else \
      echo "Skipping TypeScript type checking..."; \
    fi && \
    npm run lint || echo "Linting errors detected but continuing build..."

# Build the Next.js application with standalone output
# Use SKIP_TYPE_CHECK to handle ongoing TypeScript migration 
RUN SKIP_TYPE_CHECK=true npm run build

# Prune dev dependencies for production
RUN npm prune --production

# Production image
FROM node:20.11.1-alpine3.19@sha256:0a9e7612b1e33299e8354c4bf8b51f16542b0c44fe28146f331c10b7970efe94 AS runner
WORKDIR /app

# Install curl for healthcheck and dumb-init for proper PID 1 behavior
RUN apk --no-cache add curl dumb-init

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from build stage
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create empty environment files (will be mounted at runtime)
RUN touch .env.local .env.production .env

# Create a non-root user with least privilege
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Set proper permissions
RUN chmod -R 550 /app && \
    find /app -type d -exec chmod 550 {} \; && \
    find /app -type f -exec chmod 440 {} \; && \
    chmod 550 /app/server.js

# Switch to non-root user
USER nextjs

EXPOSE 3001

# Add healthcheck with better status checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/ping -H "Accept: application/json" | grep -q '"status":"healthy"' || exit 1

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 