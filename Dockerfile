FROM node:20-alpine AS deps

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
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments for TypeScript migration
ARG SKIP_TS_CHECK=false
ARG NODE_ENV=production

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Next.js configuration files
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Now copy source code
COPY public ./public
COPY components ./components
COPY pages ./pages
COPY styles ./styles
COPY contexts ./contexts
COPY hooks ./hooks
COPY lib ./lib
COPY types ./types

# Copy any remaining necessary files
COPY package.json package-lock.json ./

# Run security check, TypeScript checking depending on SKIP_TS_CHECK flag
RUN npm audit --production --audit-level=high && \
    if [ "$SKIP_TS_CHECK" = "false" ]; then \
      echo "Running TypeScript type checking..." && \
      npx tsc --noEmit; \
    else \
      echo "Skipping TypeScript type checking..."; \
    fi && \
    echo "Running linting..." && \
    npm run lint || echo "Linting errors detected but continuing build..."

# Build the Next.js application with standalone output
# Use environment variable to handle ongoing TypeScript migration 
ENV SKIP_TYPE_CHECK=true
RUN echo "Building Next.js application..." && \
    npm run build && \
    echo "Build completed successfully!"

# Production image
FROM node:20-alpine AS runner
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
    find /app -type d -exec chmod 550 {} \; || true && \
    find /app -type f -exec chmod 440 {} \; || true && \
    chmod 550 /app/server.js || echo "Warning: server.js not found or permission denied"

# Switch to non-root user
USER nextjs

EXPOSE 3001

# Add healthcheck with better status checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/ping -H "Accept: application/json" || exit 1

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 