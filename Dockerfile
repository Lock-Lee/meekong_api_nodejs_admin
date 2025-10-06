# Meekong API - Production Dockerfile
# Multi-stage build for optimal size and security

# ============================================================================
# Stage 1: Dependencies Installation
# ============================================================================
FROM node:22-alpine AS dependencies

LABEL maintainer="DevOps Team"
LABEL description="Meekong API - E-commerce/Auction Platform"

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files for dependency installation
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies with clean slate
RUN npm ci --only=production --no-audit --prefer-offline && \
    npm cache clean --force

# ============================================================================
# Stage 2: Development Dependencies & Build
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files and install all dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma/ ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --no-audit --prefer-offline

# Copy source code
COPY src/ ./src/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript application
RUN npm run build

# ============================================================================
# Stage 3: Production Runtime
# ============================================================================
FROM node:22-alpine AS production

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S meekong -u 1001

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=meekong:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=meekong:nodejs /app/package*.json ./

# Copy generated Prisma client
COPY --from=builder --chown=meekong:nodejs /app/generated ./generated

# Copy built application
COPY --from=builder --chown=meekong:nodejs /app/dist ./dist

# Copy Prisma schema for migrations
COPY --from=builder --chown=meekong:nodejs /app/prisma ./prisma

# Copy public assets if they exist
COPY --chown=meekong:nodejs public/ ./public/

# Create necessary directories
RUN mkdir -p logs && \
    chown -R meekong:nodejs logs

# Switch to non-root user
USER meekong

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose application port
EXPOSE ${PORT}

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/main/server.js"]
