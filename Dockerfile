FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
# Using legacy-peer-deps to handle dependency conflicts
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Build the Next.js application with standalone output
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk --no-cache add curl

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Copy necessary files from build stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy environment variables if they exist
COPY --from=builder /app/.env.local ./ || true
COPY --from=builder /app/.env.production ./ || true
COPY --from=builder /app/.env ./ || true

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/ping || exit 1

# Start the Next.js application
CMD ["node", "server.js"] 