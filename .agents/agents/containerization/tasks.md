# Containerization Tasks

**Agent**: containerization-agent
**Branch**: `docker/containerization`
**Target**: Production-ready Docker containers with full orchestration
**Duration**: 2 weeks (14 days)
**Status**: Ready (can run parallel with database-optimizer)

---

## Task 1: Backend Dockerfile (Days 1-2)

### 1.1 Create Multi-Stage Backend Dockerfile
**Status**: Pending

**File**: `infrastructure/docker/Dockerfile.backend`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs .env.example ./.env

# Switch to non-root
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "dist/index.js"]
```

**Optimization Targets**:
- Image size: <300MB
- Build time: <5 minutes
- Layers: Minimal (use multi-stage)
- Security: Non-root user, minimal attack surface

**Commit**: `docker: create multi-stage backend Dockerfile (<300MB)`

### 1.2 Create .dockerignore
```
node_modules
dist
.git
.env
*.log
coverage
.agents
*.md
```

**Commit**: `docker: add .dockerignore for efficient builds`

### 1.3 Test Backend Container
```bash
docker build -f infrastructure/docker/Dockerfile.backend -t netzwaechter-backend:latest .
docker run -p 5000:5000 --env-file .env netzwaechter-backend:latest
curl http://localhost:5000/api/health
```

---

## Task 2: Frontend Dockerfile (Days 3-4)

### 2.1 Create Multi-Stage Frontend Dockerfile
**Status**: Pending

**File**: `infrastructure/docker/Dockerfile.frontend`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx files
RUN rm -rf ./*

# Copy built files
COPY --from=builder /app/dist/public ./

# Copy nginx config
COPY infrastructure/docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Optimization Targets**:
- Image size: <200MB
- Static file serving optimized
- Gzip compression enabled

**Commit**: `docker: create multi-stage frontend Dockerfile with Nginx (<200MB)`

### 2.2 Create Nginx Configuration
**File**: `infrastructure/docker/nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API proxy to backend
        location /api {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Commit**: `docker: add Nginx config with reverse proxy and caching`

---

## Task 3: Docker Compose - Base Configuration (Days 5-6)

### 3.1 Create Main docker-compose.yml
**Status**: Pending

**File**: `infrastructure/docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: netzwaechter-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-netzwaechter}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - netzwaechter-network

  redis:
    image: redis:7-alpine
    container_name: netzwaechter-redis
    command: redis-server --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD is required}
    volumes:
      - redis-data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - netzwaechter-network

  backend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.backend
    container_name: netzwaechter-backend
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-netzwaechter}?sslmode=disable
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET is required}
      MAILSERVER_PASSWORD: ${MAILSERVER_PASSWORD}
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 5000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    volumes:
      - backend-logs:/app/logs
    restart: unless-stopped
    networks:
      - netzwaechter-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.frontend
    container_name: netzwaechter-frontend
    depends_on:
      - backend
    ports:
      - "${FRONTEND_PORT:-80}:80"
    restart: unless-stopped
    networks:
      - netzwaechter-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  backend-logs:
    driver: local

networks:
  netzwaechter-network:
    driver: bridge
```

**Commit**: `docker: create docker-compose.yml with full stack`

### 3.2 Test Full Stack
```bash
cd infrastructure/docker
docker-compose up -d
docker-compose ps
docker-compose logs -f
```

**Verify**:
- All containers healthy
- Frontend accessible at http://localhost
- Backend accessible at http://localhost/api
- Database connections working

---

## Task 4: Development Configuration (Days 7-8)

### 4.1 Create docker-compose.dev.yml
**File**: `infrastructure/docker/docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.backend
      target: builder  # Stop at build stage for dev
    command: npm run dev  # Hot reload
    environment:
      NODE_ENV: development
    volumes:
      - ../../server:/app/server:ro  # Mount source code
      - ../../client:/app/client:ro
      - /app/node_modules  # Keep node_modules from image
    ports:
      - "5000:5000"
      - "9229:9229"  # Debug port

  frontend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.frontend
      target: builder
    command: npm run dev
    environment:
      VITE_API_URL: http://localhost:5000
    volumes:
      - ../../client:/app/client:ro
      - /app/node_modules
    ports:
      - "5173:5173"

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: netzwaechter-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@netzwaechter.local
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - netzwaechter-network

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: netzwaechter-redis-ui
    environment:
      REDIS_HOSTS: local:redis:6379:0:${REDIS_PASSWORD}
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - netzwaechter-network
```

**Usage**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Commit**: `docker: add development overrides with hot reload`

---

## Task 5: Production Configuration (Days 9-10)

### 5.1 Create docker-compose.prod.yml
```yaml
version: '3.8'

services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  backend:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  frontend:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

**Commit**: `docker: add production config with resource limits and scaling`

---

## Task 6: Environment Management (Day 10)

### 6.1 Create .env.example
```bash
# Database
DB_NAME=netzwaechter
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
DB_PORT=5432

# Redis
REDIS_PASSWORD=CHANGE_ME
REDIS_PORT=6379

# Backend
SESSION_SECRET=CHANGE_ME_MINIMUM_64_CHARACTERS
MAILSERVER_PASSWORD=CHANGE_ME
NODE_ENV=production
BACKEND_PORT=5000

# Frontend
FRONTEND_PORT=80

# PgAdmin (dev only)
PGADMIN_PASSWORD=admin
```

### 6.2 Create Environment Validation Script
**File**: `infrastructure/scripts/validate-env.sh`

```bash
#!/bin/bash
set -e

REQUIRED_VARS=(
  "DB_PASSWORD"
  "REDIS_PASSWORD"
  "SESSION_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: $var is not set"
    exit 1
  fi
done

echo "✅ All required environment variables are set"
```

**Commit**: `docker: add environment management and validation`

---

## Task 7: Deployment Scripts (Days 11-12)

### 7.1 Build Script
**File**: `infrastructure/scripts/docker-build.sh`

```bash
#!/bin/bash
set -e

echo "🔨 Building Docker images..."

docker build -f infrastructure/docker/Dockerfile.backend -t netzwaechter-backend:latest ../..
docker build -f infrastructure/docker/Dockerfile.frontend -t netzwaechter-frontend:latest ../..

echo "✅ Build complete"
docker images | grep netzwaechter
```

### 7.2 Deploy Script
**File**: `infrastructure/scripts/docker-deploy.sh`

```bash
#!/bin/bash
set -e

# Validate environment
./infrastructure/scripts/validate-env.sh

# Pull latest code
git pull origin main

# Build images
./infrastructure/scripts/docker-build.sh

# Stop existing containers
docker-compose down

# Start new containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for health checks
echo "⏳ Waiting for containers to be healthy..."
sleep 10

# Check status
docker-compose ps

echo "✅ Deployment complete"
```

### 7.3 Backup Script
**File**: `infrastructure/scripts/docker-backup.sh`

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup database
docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter > $BACKUP_DIR/database.sql

# Backup Redis
docker exec netzwaechter-redis redis-cli SAVE
docker cp netzwaechter-redis:/data/dump.rdb $BACKUP_DIR/redis.rdb

echo "✅ Backup saved to $BACKUP_DIR"
```

**Commit**: `docker: add deployment and backup scripts`

---

## Task 8: Documentation (Days 13-14)

### 8.1 Create DOCKER_SETUP.md
```markdown
# Docker Setup Guide

## Prerequisites
- Docker 24.0+
- Docker Compose 2.0+

## Quick Start (Development)
1. Copy environment file:
   `cp .env.example .env`

2. Edit `.env` with your values

3. Start containers:
   `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

4. Access:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - PgAdmin: http://localhost:5050

## Production Deployment
See `DEPLOYMENT.md`
```

### 8.2 Create DEPLOYMENT.md
Full deployment guide with troubleshooting

### 8.3 Create TROUBLESHOOTING.md
Common issues and solutions

**Commit**: `docs: add comprehensive Docker documentation`

---

## Task 9: Testing & Verification (Day 14)

### 9.1 Test Checklist
- [ ] Backend container builds (<5 min, <300MB)
- [ ] Frontend container builds (<3 min, <200MB)
- [ ] Full stack starts with single command
- [ ] All health checks passing
- [ ] API endpoints accessible
- [ ] Frontend loads correctly
- [ ] Hot reload works in dev mode
- [ ] Database persistence works
- [ ] Redis caching works
- [ ] Nginx reverse proxy works
- [ ] Static files cached correctly
- [ ] Security headers present

### 9.2 Load Testing
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test backend
ab -n 1000 -c 10 http://localhost/api/health

# Test frontend
ab -n 1000 -c 10 http://localhost/
```

**Commit**: `docker: complete containerization with full testing`

---

## Success Criteria

- [ ] Backend Dockerfile created (multi-stage, <300MB)
- [ ] Frontend Dockerfile created (multi-stage, <200MB)
- [ ] docker-compose.yml works (full stack starts)
- [ ] Development mode supports hot reload
- [ ] Production config has resource limits
- [ ] All health checks passing
- [ ] Networking configured correctly
- [ ] Volumes persist data
- [ ] Documentation complete
- [ ] Deployment scripts functional
- [ ] Backup/restore tested
- [ ] Load testing passed

---

## Rollback Plan

```bash
# Stop all containers
docker-compose down

# Remove volumes (if needed)
docker volume rm $(docker volume ls -q | grep netzwaechter)

# Revert to pre-Docker state
git checkout main -- infrastructure/
rm -rf infrastructure/docker

# Use traditional deployment
npm install
npm run build
npm start
```
