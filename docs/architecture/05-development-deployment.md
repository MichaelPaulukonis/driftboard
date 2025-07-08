# Development & Deployment Architecture - DriftBoard

## Development Environment Setup

### Prerequisites and Dependencies
```bash
# Required software versions
node --version    # >= 23.0.0
npm --version     # >= 10.0.0
docker --version  # >= 20.0.0
git --version     # >= 2.30.0

# Optional but recommended
code --version    # VS Code for IDE
```

### Project Structure
```
driftboard/
├── docs/                          # Documentation
│   ├── architecture/              # Architecture documentation
│   └── product_requirements_doc.md
├── frontend/                      # React application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   ├── store/                 # Redux store configuration
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Utility functions
│   │   ├── types/                 # TypeScript type definitions
│   │   └── services/              # API services
│   ├── public/                    # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                       # Node.js API server
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   ├── services/              # Business logic
│   │   ├── repositories/          # Data access layer
│   │   ├── middleware/            # Express middleware
│   │   ├── routes/                # API routes
│   │   ├── types/                 # TypeScript types
│   │   └── utils/                 # Utility functions
│   ├── prisma/                    # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/                     # Test files
│   ├── package.json
│   └── tsconfig.json
├── docker/                        # Docker configuration
│   ├── docker-compose.yml         # Development environment
│   ├── docker-compose.prod.yml    # Production environment
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── nginx.conf
├── scripts/                       # Automation scripts
│   ├── setup.sh                   # Initial setup script
│   ├── dev.sh                     # Development start script
│   └── deploy.sh                  # Deployment script
├── .env.example                   # Environment variables template
├── .gitignore
└── README.md
```

### Development Environment Configuration

#### Environment Variables
```bash
# .env.development
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"

# Backend Configuration
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Configuration
API_BASE_URL="http://localhost:8000"
JWT_SECRET="your-jwt-secret-for-development"

# Logging
LOG_LEVEL="debug"
```

#### Docker Development Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
      target: development
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - db_data:/app/prisma
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./prisma/dev.db
    depends_on:
      - db

  db:
    image: alpine:latest
    volumes:
      - db_data:/data
    command: ["sleep", "infinity"]

volumes:
  db_data:
```

#### Frontend Development Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@store': path.resolve(__dirname, './src/store'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

#### Backend Development Configuration
```typescript
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "tsx src/index.ts",
  "env": {
    "NODE_ENV": "development"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@controllers/*": ["controllers/*"],
      "@services/*": ["services/*"],
      "@repositories/*": ["repositories/*"],
      "@middleware/*": ["middleware/*"],
      "@types/*": ["types/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Development Workflow

#### Getting Started Script
```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up DriftBoard development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Copy environment files
echo "📝 Setting up environment variables..."
cp .env.example .env.development
echo "⚠️  Please update .env.development with your Firebase configuration"

# Install dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install

echo "📦 Installing backend dependencies..."
cd ../backend && npm install

# Setup database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

# Build containers
echo "🐳 Building Docker containers..."
cd ..
docker-compose build

echo "✅ Setup complete! Run 'npm run dev' to start development servers."
```

#### Development Start Script
```bash
#!/bin/bash
# scripts/dev.sh

echo "🚀 Starting DriftBoard development environment..."

# Start all services
docker-compose up --build

# Alternative: Start services individually
# echo "Starting backend..."
# cd backend && npm run dev &
# BACKEND_PID=$!

# echo "Starting frontend..."
# cd frontend && npm run dev &
# FRONTEND_PID=$!

# echo "Development servers started!"
# echo "Frontend: http://localhost:3000"
# echo "Backend: http://localhost:8000"
# echo "Press Ctrl+C to stop all services"

# wait $BACKEND_PID $FRONTEND_PID
```

## CI/CD Pipeline Architecture (Future Phase)

### GitHub Actions Configuration
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: driftboard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '23'
        cache: 'npm'
        cache-dependency-path: |
          frontend/package-lock.json
          backend/package-lock.json

    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && npm ci

    - name: Run linting
      run: |
        cd frontend && npm run lint
        cd ../backend && npm run lint

    - name: Run type checking
      run: |
        cd frontend && npm run type-check
        cd ../backend && npm run type-check

    - name: Run unit tests
      run: |
        cd frontend && npm run test:unit
        cd ../backend && npm run test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/driftboard_test

    - name: Run E2E tests
      run: |
        cd frontend && npm run test:e2e:headless
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/driftboard_test

    - name: Build applications
      run: |
        cd frontend && npm run build
        cd ../backend && npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: |
        cd frontend && npm audit --audit-level high
        cd ../backend && npm audit --audit-level high

    - name: Run dependency check
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: 'dependency-check-report.sarif'

  build-and-push:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push images
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/frontend:latest
          ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
        file: docker/frontend.Dockerfile
        target: production

    - name: Build and push backend
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/backend:latest
          ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
        file: docker/backend.Dockerfile
        target: production
```

## Deployment Strategy

### Local Docker Deployment

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
      - static_files:/usr/share/nginx/html/static
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
      target: production
    volumes:
      - static_files:/app/dist
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
      target: production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/data/production.db
    volumes:
      - db_data:/data
      - logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backup:
    image: alpine:latest
    volumes:
      - db_data:/data:ro
      - ./backups:/backups
    command: |
      sh -c "
        while true; do
          echo 'Creating backup...'
          cp /data/production.db /backups/backup-$(date +%Y%m%d-%H%M%S).db
          find /backups -name 'backup-*.db' -mtime +7 -delete
          sleep 86400
        done
      "
    restart: unless-stopped

volumes:
  db_data:
  static_files:
  logs:
```

#### Production Dockerfile Examples
```dockerfile
# docker/frontend.Dockerfile
FROM node:23-alpine AS base
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

FROM base AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM base AS development
WORKDIR /app
USER frontend
COPY --chown=frontend:nodejs frontend/package*.json ./
RUN npm install
COPY --chown=frontend:nodejs frontend/ .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

```dockerfile
# docker/backend.Dockerfile
FROM node:23-alpine AS base
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

FROM base AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM base AS production
WORKDIR /app
USER backend
COPY --from=deps --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/prisma ./prisma
COPY --chown=backend:nodejs backend/package*.json ./

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["npm", "start"]

FROM base AS development
WORKDIR /app
USER backend
COPY --chown=backend:nodejs backend/package*.json ./
RUN npm install
COPY --chown=backend:nodejs backend/ .
EXPOSE 8000
CMD ["npm", "run", "dev"]
```

### Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Deploying DriftBoard to production..."

# Environment validation
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found"
    exit 1
fi

# Backup current deployment
echo "💾 Creating backup of current deployment..."
docker-compose -f docker-compose.prod.yml exec backup /bin/sh -c "cp /data/production.db /backups/pre-deploy-$(date +%Y%m%d-%H%M%S).db"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build new images
echo "🔨 Building new images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Update services with zero downtime
echo "♻️  Updating services..."
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# Health check
echo "🏥 Performing health check..."
sleep 10
if ! curl -f http://localhost/health; then
    echo "❌ Health check failed, rolling back..."
    docker-compose -f docker-compose.prod.yml rollback
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Application available at: http://localhost"
```

## Monitoring and Logging

### Application Monitoring
```typescript
// backend/src/middleware/monitoring.ts
import prometheus from 'prom-client';

// Create metrics registry
const register = new prometheus.Registry();

// Default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseQueryDuration);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
```

### Structured Logging
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'driftboard-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
  next();
};
```

### Health Check Endpoints
```typescript
// backend/src/routes/health.ts
export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: 'checking',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    logger.error('Database health check failed', error);
  }

  const status = Object.values(checks).includes('error') ? 500 : 200;
  res.status(status).json(checks);
});

healthRouter.get('/metrics', metricsEndpoint);
```

### Log Aggregation (Future)
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # ... existing services ...

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - logs:/var/log
      - ./monitoring/promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```
