# Netzwächter Docker Infrastructure

Production-ready Docker containerization for the Netzwächter monitoring portal.

## 🚀 Quick Start

### Development
```bash
# 1. Copy environment file
cp infrastructure/docker/.env.example infrastructure/docker/.env

# 2. Generate secrets and update .env:
openssl rand -base64 32  # for DB_PASSWORD
openssl rand -base64 32  # for REDIS_PASSWORD
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # for SESSION_SECRET

# 3. Start services
cd infrastructure/docker
docker-compose up
```

### Production
```bash
# Configure .env then:
cd infrastructure/docker
docker-compose up -d
```

## 📦 Architecture

- **Frontend**: Nginx + React (< 200MB)
- **Backend**: Node.js + Express (<300MB)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7

## 🛠️ Features

✅ Multi-stage builds for minimal image size
✅ Health checks for automatic recovery
✅ Security hardening (non-root users)
✅ Resource limits
✅ Nginx caching & compression
✅ Hot reload support (development)

## 📁 Files

- `Dockerfile.backend` - Backend container
- `Dockerfile.frontend` - Frontend + Nginx
- `docker-compose.yml` - Full stack orchestration
- `.env.example` - Environment template
- `nginx/nginx.conf` - Nginx configuration

## Access Points

- Frontend: http://localhost
- Backend API: http://localhost/api
- Direct Backend: http://localhost:5000

## 🔒 Security

Required environment variables:
- `DB_PASSWORD` - PostgreSQL password (generate with openssl)
- `REDIS_PASSWORD` - Redis password
- `SESSION_SECRET` - 128+ character secret

## 📊 Container Status

```bash
docker-compose ps
docker-compose logs -f
docker stats
```

## 🆘 Troubleshooting

```bash
# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Rebuild
docker-compose up -d --build

# Clean restart
docker-compose down -v && docker-compose up -d
```

For detailed documentation, see the full guides (DOCKER_SETUP.md, DEPLOYMENT.md, TROUBLESHOOTING.md) in this directory.
