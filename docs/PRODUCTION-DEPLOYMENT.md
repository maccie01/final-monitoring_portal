# Production Deployment Guide

Comprehensive guide for deploying Netzwächter to production environments.

Created: 2025-10-08

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Docker Deployment](#docker-deployment)
5. [Database Setup](#database-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Post-Deployment](#post-deployment)
8. [Monitoring and Health Checks](#monitoring-and-health-checks)
9. [Backup Procedures](#backup-procedures)
10. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Server Requirements

**Minimum Production Server Specifications:**
- CPU: 2 cores (4 cores recommended)
- RAM: 4GB minimum (8GB recommended)
- Disk: 20GB minimum SSD storage
- OS: Ubuntu 20.04+ LTS or similar Linux distribution
- Network: Static IP or domain name configured

**Required Software:**
- Docker Engine 24.0+
- Docker Compose 2.20+
- Git 2.30+
- OpenSSL 1.1.1+

### Production Server Setup

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Add current user to docker group
sudo usermod -aG docker $USER

# Verify installations
docker --version
docker compose version
```

## Environment Setup

### Required Environment Variables

The application requires the following environment variables to be configured:

#### Database Configuration
```bash
DB_NAME=netzwaechter
DB_USER=postgres
DB_PASSWORD=<strong-random-password>
DB_PORT=5432
```

#### Redis Configuration
```bash
REDIS_PASSWORD=<strong-random-password>
REDIS_PORT=6379
```

#### Session Security
```bash
# CRITICAL: Generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=<128-character-minimum-secret>
```

#### Application Configuration
```bash
NODE_ENV=production
BACKEND_PORT=5000
FRONTEND_PORT=80
```

#### Email Service
```bash
MAILSERVER_PASSWORD=<your-smtp-password>
# Optional: MAILSERVER_CA_CERT=/path/to/ca-certificate.crt
```

#### Database Connection Pool
```bash
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
```

#### Production Scaling (Optional)
```bash
BACKEND_REPLICAS=2
FRONTEND_REPLICAS=2
```

### Generating Secure Credentials

**Generate strong passwords:**
```bash
# For database and Redis passwords
openssl rand -base64 32

# For SESSION_SECRET (128+ characters required)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Security Best Practices:**
- Use unique passwords for each service
- Never reuse credentials across environments
- Store credentials in a secure password manager
- Rotate credentials every 90 days for SESSION_SECRET
- Rotate database/Redis passwords every 180 days

## Pre-Deployment Checklist

Before deploying to production, verify all items:

### Code Quality
- [ ] All unit tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run check`)
- [ ] Build process completes without errors (`npm run build`)
- [ ] No security vulnerabilities (`npm audit`)

### Security Audit
- [ ] Environment variables configured (no hardcoded secrets)
- [ ] SESSION_SECRET is 128+ characters
- [ ] Database passwords are strong (32+ characters)
- [ ] Redis password is configured
- [ ] SSL/TLS certificates obtained and valid
- [ ] Email SMTP credentials secured

### Database
- [ ] Production database created
- [ ] Database user created with appropriate permissions
- [ ] Database connection string tested
- [ ] SSL mode enabled in DATABASE_URL
- [ ] Backup strategy implemented

### Infrastructure
- [ ] Server meets minimum specifications
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Domain name configured with DNS
- [ ] Reverse proxy setup (if applicable)

### Application Configuration
- [ ] .env file created from .env.example
- [ ] All required environment variables set
- [ ] File permissions set correctly (chmod 600 .env)
- [ ] Email SMTP settings configured in database

## Docker Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/netzwaechter
cd /opt/netzwaechter

# Clone repository
git clone <repository-url> .

# Checkout specific version/tag for production
git checkout tags/v1.0.0  # Replace with your version
```

### 2. Configure Environment

```bash
# Navigate to Docker infrastructure directory
cd infrastructure/docker

# Copy and configure environment file
cp .env.example .env
nano .env  # or vim .env

# Set secure file permissions
chmod 600 .env
```

**Important: Update ALL placeholder values in .env:**
- Replace `CHANGE_ME_*` values
- Generate strong random secrets
- Configure database connection details
- Set SMTP credentials

### 3. Build Docker Images

```bash
# Build all images (from infrastructure/docker directory)
docker compose -f docker-compose.prod.yml build

# Verify images built successfully
docker images | grep netzwaechter
```

### 4. Start Services

```bash
# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Verify all containers are running
docker compose -f docker-compose.prod.yml ps

# Check service health
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### 5. Verify Deployment

```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis

# Test API endpoint
curl http://localhost:5000/api/users

# Test frontend
curl http://localhost:80
```

### Docker Compose Architecture

The production deployment uses the following services:

**PostgreSQL Database:**
- Image: postgres:16-alpine
- Port: 5432
- Persistent storage: postgres-data volume
- Health checks: pg_isready every 10s

**Redis Cache:**
- Image: redis:7-alpine
- Port: 6379
- Persistent storage: redis-data volume
- Health checks: redis-cli ping every 10s

**Backend API:**
- Multi-stage build from Dockerfile.backend
- Port: 5000
- Health checks: API endpoint every 30s
- Automatic restart: unless-stopped

**Frontend Nginx:**
- Multi-stage build from Dockerfile.frontend
- Port: 80
- Serves static assets
- Proxies API requests to backend
- Health checks: /health endpoint every 30s

## Database Setup

### Initial Database Migration

The application automatically creates tables on first run. However, for production, you may want to manually verify:

```bash
# Connect to database container
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter

# List all tables
\dt

# Verify key tables exist:
# - users, monitoring_targets, logs, settings, etc.

# Exit psql
\q
```

### Database Connection Testing

```bash
# Test database connectivity from backend container
docker exec -it netzwaechter-backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err);
  else console.log('Success:', res.rows[0]);
  process.exit();
});
"
```

### Configure Email Settings in Database

Email configuration is stored in the database. Configure via the application UI or directly:

```sql
-- Connect to database
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter

-- Insert/Update email settings
-- Note: The UI Settings page is the recommended method
-- This is provided for reference only
```

## SSL/TLS Configuration

### Option 1: Using Nginx Reverse Proxy (Recommended)

Install and configure Nginx on the host machine:

```bash
# Install Nginx
sudo apt-get install nginx certbot python3-certbot-nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/netzwaechter
```

**Nginx Configuration Template:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Docker frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable configuration:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/netzwaechter /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Reload Nginx
sudo systemctl reload nginx
```

### Option 2: Using Traefik (Alternative)

See `docs/SSL-CONFIGURATION.md` for detailed Traefik setup instructions.

### SSL Certificate Auto-Renewal

```bash
# Certbot sets up automatic renewal via systemd timer
# Verify renewal timer is active
sudo systemctl status certbot.timer

# Test renewal process (dry run)
sudo certbot renew --dry-run
```

## Post-Deployment

### Initial Admin User Creation

Create the first admin user through the application UI:

1. Navigate to https://your-domain.com
2. Click "Register" to create the first user account
3. The first registered user automatically becomes an admin
4. Subsequent users must be approved by an admin

### Application Configuration

Configure the following in the application UI (Settings page):

**Email SMTP Settings:**
- SMTP Host
- SMTP Port
- SMTP Username
- Enable/disable TLS
- From email address

**Monitoring Configuration:**
- Default check intervals
- Alert thresholds
- Notification preferences

### Verify Core Functionality

Test critical application features:

```bash
# Test user authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Test monitoring endpoints
curl https://your-domain.com/api/monitoring/targets

# Test health check
curl https://your-domain.com/health
```

## Monitoring and Health Checks

### Container Health Monitoring

```bash
# Check all container health status
docker compose -f docker-compose.prod.yml ps

# View real-time health checks
watch -n 5 'docker compose -f docker-compose.prod.yml ps'
```

### Application Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Resource Monitoring

```bash
# Monitor container resource usage
docker stats

# Check disk usage
docker system df

# Check volume sizes
docker volume ls
du -sh /var/lib/docker/volumes/docker_postgres-data
```

### Health Check Endpoints

The application provides the following health check endpoints:

- **Frontend:** `http://localhost/health` (returns "healthy")
- **Backend API:** `http://localhost:5000/api/users` (requires authentication)
- **PostgreSQL:** Internal health check via `pg_isready`
- **Redis:** Internal health check via `redis-cli ping`

### Automated Monitoring Setup

Consider implementing:

1. **Uptime Monitoring:** Use services like UptimeRobot or Pingdom
2. **Application Performance:** New Relic, DataDog, or Prometheus
3. **Log Aggregation:** ELK Stack, Grafana Loki, or Papertrail
4. **Alert Configuration:** Email, Slack, or PagerDuty integration

## Backup Procedures

### Database Backups

**Automated Daily Backup Script:**

```bash
#!/bin/bash
# /opt/netzwaechter/scripts/backup-database.sh

BACKUP_DIR="/opt/netzwaechter/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/netzwaechter_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create compressed backup
docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter | gzip > $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "netzwaechter_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Setup Automated Backups:**

```bash
# Make script executable
chmod +x /opt/netzwaechter/scripts/backup-database.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/netzwaechter/scripts/backup-database.sh >> /var/log/netzwaechter-backup.log 2>&1") | crontab -
```

### Manual Database Backup

```bash
# Create backup
docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter > backup.sql

# Create compressed backup
docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter | gzip > backup.sql.gz
```

### Database Restore

```bash
# From uncompressed backup
docker exec -i netzwaechter-postgres psql -U postgres netzwaechter < backup.sql

# From compressed backup
gunzip -c backup.sql.gz | docker exec -i netzwaechter-postgres psql -U postgres netzwaechter
```

### Volume Backups

```bash
# Backup all Docker volumes
docker run --rm \
  -v docker_postgres-data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz -C /source .

docker run --rm \
  -v docker_redis-data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis-data-$(date +%Y%m%d).tar.gz -C /source .
```

### Off-Site Backup

Configure automated off-site backups to cloud storage:

```bash
# Example using AWS S3
aws s3 sync /opt/netzwaechter/backups s3://your-backup-bucket/netzwaechter/

# Example using rsync to remote server
rsync -avz /opt/netzwaechter/backups/ user@backup-server:/backups/netzwaechter/
```

## Rollback Procedures

### Application Rollback

**To Previous Docker Image:**

```bash
# Stop current deployment
cd /opt/netzwaechter/infrastructure/docker
docker compose -f docker-compose.prod.yml down

# Checkout previous version
cd /opt/netzwaechter
git fetch --tags
git checkout tags/v1.0.0  # Replace with previous stable version

# Rebuild and restart
cd infrastructure/docker
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

### Database Rollback

**Restore from Backup:**

```bash
# Stop application
docker compose -f docker-compose.prod.yml stop backend

# Drop and recreate database
docker exec -it netzwaechter-postgres psql -U postgres -c "DROP DATABASE netzwaechter;"
docker exec -it netzwaechter-postgres psql -U postgres -c "CREATE DATABASE netzwaechter;"

# Restore from backup
gunzip -c backup.sql.gz | docker exec -i netzwaechter-postgres psql -U postgres netzwaechter

# Restart application
docker compose -f docker-compose.prod.yml start backend
```

### Quick Rollback Checklist

1. [ ] Notify users of maintenance window
2. [ ] Create current state backup
3. [ ] Stop affected services
4. [ ] Checkout previous code version
5. [ ] Restore database if needed
6. [ ] Rebuild Docker images
7. [ ] Start services
8. [ ] Verify functionality
9. [ ] Monitor logs for errors
10. [ ] Notify users deployment is complete

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs backend

# Check environment variables
docker compose -f docker-compose.prod.yml config

# Verify all required variables are set
grep -E "^[A-Z_]+" .env
```

**Database connection errors:**
```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter -c "SELECT 1;"
```

**Frontend not accessible:**
```bash
# Check Nginx status
docker compose -f docker-compose.prod.yml logs frontend

# Verify port is accessible
netstat -tlnp | grep :80

# Check firewall rules
sudo ufw status
```

## Security Hardening

### Post-Deployment Security Steps

1. **Configure Firewall:**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

2. **Enable Fail2Ban:**
```bash
sudo apt-get install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

3. **Regular Security Updates:**
```bash
# Setup automatic security updates
sudo apt-get install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

4. **Docker Security:**
```bash
# Run Docker in rootless mode (recommended for enhanced security)
# See: https://docs.docker.com/engine/security/rootless/
```

## Performance Optimization

### Docker Resource Limits

Update `docker-compose.prod.yml` to add resource constraints:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Database Performance

```bash
# Optimize PostgreSQL configuration
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter

# Run VACUUM ANALYZE periodically
VACUUM ANALYZE;

# Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review application logs for errors
- Check disk space usage
- Verify backup completion

**Monthly:**
- Review and rotate logs
- Update Docker images to latest patch versions
- Review security advisories
- Test backup restoration

**Quarterly:**
- Rotate SESSION_SECRET
- Update SSL certificates (if not automated)
- Performance audit
- Security penetration testing

### Getting Help

- Application Documentation: `/docs` directory
- Issue Tracker: GitHub Issues
- Security Issues: Report via email (not public issues)

## Appendix

### Environment Variable Reference

See complete documentation in:
- `/server/ENVIRONMENT_VARIABLES.md`
- `/server/SESSION_SECURITY.md`
- `/server/EMAIL_SECURITY.md`

### Related Documentation

- `CI-CD-SETUP.md` - Automated deployment pipeline
- `OPERATIONS-RUNBOOK.md` - Day-to-day operations guide
- `SSL-CONFIGURATION.md` - Detailed SSL/TLS setup
- `FRONTEND-ARCHITECTURE.md` - Frontend application structure
- `INTEGRATION_TEST_CHECKLIST.md` - Testing procedures
