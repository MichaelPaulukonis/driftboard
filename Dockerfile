# Multi-stage Docker build for DriftBoard monolithic application

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci --only=production

COPY src/frontend/ ./
COPY src/shared/ ../shared/
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma/ ./prisma/
COPY src/shared/ ./src/shared/
COPY src/backend/ ./src/backend/

# Install dependencies and generate Prisma client
RUN npm ci --only=production
RUN npx prisma generate

# Build backend
RUN npm run build:backend

# Stage 3: Production runtime
FROM node:20-alpine AS runtime

# Install SQLite and other dependencies
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy built backend
COPY --from=backend-builder /app/src/backend/dist ./dist/
COPY --from=backend-builder /app/src/shared ./src/shared/
COPY --from=backend-builder /app/node_modules ./node_modules/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./src/frontend/dist/

# Copy Prisma files and generated client
COPY --from=backend-builder /app/prisma ./prisma/

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:8000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "dist/server.js"]
