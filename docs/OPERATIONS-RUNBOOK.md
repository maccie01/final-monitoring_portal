# Operations Runbook

Day-to-day operations guide for Netzwächter production system.

Created: 2025-10-08

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Common Operations Tasks](#common-operations-tasks)
4. [Monitoring and Dashboards](#monitoring-and-dashboards)
5. [Alert Handling](#alert-handling)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Incident Response](#incident-response)
8. [Maintenance Procedures](#maintenance-procedures)
9. [Performance Optimization](#performance-optimization)
10. [Emergency Contacts](#emergency-contacts)

## Overview

### Purpose

This runbook provides operational procedures for maintaining and troubleshooting the Netzwächter monitoring system in production.

### System Components

- **Frontend:** Nginx serving React SPA (Port 80/443)
- **Backend:** Node.js/Express API (Port 5000)
- **Database:** PostgreSQL 16 (Port 5432)
- **Cache:** Redis 7 (Port 6379)

### Service Dependencies

```
User Request
    ↓
Frontend (Nginx) → Backend (Node.js) → Database (PostgreSQL)
                        ↓
                   Cache (Redis)
```

## System Architecture

### Deployment Architecture

```
Internet
    ↓
Nginx Reverse Proxy (SSL/TLS termination)
    ↓
Docker Network (netzwaechter-network)
    ├─ Frontend Container (Port 80)
    ├─ Backend Container (Port 5000)
    ├─ PostgreSQL Container (Port 5432)
    └─ Redis Container (Port 6379)
```

### Data Flow

1. User accesses frontend via HTTPS
2. Nginx serves static assets
3. API requests proxied to backend
4. Backend queries database/cache
5. Response returned to user

### Container Health Checks

All containers have automated health checks:
- **Frontend:** HTTP GET /health (every 30s)
- **Backend:** HTTP GET /api/users (every 30s)
- **PostgreSQL:** pg_isready (every 10s)
- **Redis:** redis-cli ping (every 10s)

## Common Operations Tasks

### Checking Service Status

```bash
# Check all containers
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml ps

# Check specific service
docker ps | grep netzwaechter

# View service health
docker inspect netzwaechter-backend | grep -A 10 '"Health"'
```

### Viewing Logs

```bash
# All services
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs -f

# Specific service
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs -f backend
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs -f frontend
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs -f postgres
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs -f redis

# Last 100 lines
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs --tail=100 backend

# Follow logs with timestamps
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs -f -t backend

# Search logs for errors
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs backend | grep -i error
```

### Restarting Services

```bash
# Restart all services
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml restart

# Restart specific service
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml restart backend

# Graceful restart with health check wait
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml up -d --force-recreate backend
```

### Scaling Services

```bash
# Scale backend (horizontal scaling)
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml up -d --scale backend=3

# Scale down
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml up -d --scale backend=1
```

### Managing Users

```bash
# Access database
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter

# List all users
SELECT id, username, email, role, created_at FROM users;

# Create new user (password should be hashed by application)
# Use application UI instead - direct DB manipulation not recommended

# Update user role
UPDATE users SET role = 'admin' WHERE username = 'username';

# Disable user account
UPDATE users SET is_active = false WHERE username = 'username';

# Exit psql
\q
```

### Database Operations

```bash
# Connect to database
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter

# Check database size
SELECT pg_size_pretty(pg_database_size('netzwaechter'));

# List tables
\dt

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill long-running query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';

# Vacuum and analyze
VACUUM ANALYZE;

# Exit
\q
```

### Redis Cache Operations

```bash
# Connect to Redis
docker exec -it netzwaechter-redis redis-cli

# Authenticate (if password protected)
AUTH your-redis-password

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST

# Monitor commands in real-time
MONITOR

# Clear specific keys
KEYS session:*
DEL session:abc123

# Clear all cache (USE WITH CAUTION)
FLUSHDB

# Exit
exit
```

## Monitoring and Dashboards

### System Resource Monitoring

```bash
# Monitor container resource usage in real-time
docker stats

# Check disk usage
df -h
docker system df

# Check volume sizes
docker volume ls
du -sh /var/lib/docker/volumes/docker_postgres-data/_data
du -sh /var/lib/docker/volumes/docker_redis-data/_data

# Monitor network usage
docker network inspect netzwaechter-network

# Check system memory
free -h

# Check CPU usage
top
```

### Application Metrics

```bash
# Backend API health check
curl http://localhost:5000/api/users
curl https://yourdomain.com/api/users

# Frontend health check
curl http://localhost/health
curl https://yourdomain.com/health

# Database connectivity test
docker exec netzwaechter-postgres pg_isready -U postgres

# Redis connectivity test
docker exec netzwaechter-redis redis-cli ping

# Check response time
time curl -o /dev/null -s -w '%{time_total}\n' https://yourdomain.com
```

### Log Analysis

```bash
# Count errors in last hour
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs --since 1h backend | grep -c ERROR

# Find slow queries
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs backend | grep "slow query"

# Monitor failed login attempts
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs backend | grep "failed login"

# Check for memory issues
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml logs backend | grep -i "out of memory"
```

### Performance Metrics

Key metrics to monitor:

- **Response Time:** < 200ms for API calls
- **Database Connection Pool:** 5-20 active connections
- **Memory Usage:** < 80% for all containers
- **CPU Usage:** < 70% average
- **Disk Usage:** < 80% capacity
- **Error Rate:** < 1% of requests

## Alert Handling

### Alert Priority Levels

**P0 - Critical (Immediate response required)**
- Service completely down
- Database unavailable
- Data loss occurring
- Security breach

**P1 - High (Response within 1 hour)**
- Significant performance degradation
- High error rates (>5%)
- Disk space critical (>90%)
- Multiple services degraded

**P2 - Medium (Response within 4 hours)**
- Minor performance issues
- Non-critical service degraded
- Warning thresholds exceeded

**P3 - Low (Response within 24 hours)**
- Informational alerts
- Optimization opportunities
- Scheduled maintenance needed

### Alert Response Procedures

**Service Down Alert:**
1. Check container status: `docker ps`
2. View logs: `docker compose logs -f <service>`
3. Check resource usage: `docker stats`
4. Attempt restart: `docker compose restart <service>`
5. Escalate if restart fails

**High Error Rate Alert:**
1. Check logs for error patterns
2. Identify affected endpoints
3. Check database connectivity
4. Review recent deployments
5. Consider rollback if needed

**High Memory Usage Alert:**
1. Check container memory: `docker stats`
2. Review application logs for memory leaks
3. Check database connection pool
4. Consider container restart
5. Scale resources if needed

**Disk Space Alert:**
1. Check disk usage: `df -h`
2. Clean Docker system: `docker system prune -a`
3. Archive old backups
4. Clean log files
5. Increase disk capacity if needed

## Troubleshooting Guide

### Service Won't Start

**Symptoms:** Container exits immediately after starting

**Diagnosis:**
```bash
# Check container logs
docker compose logs backend

# Check configuration
docker compose config

# Verify environment variables
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml config | grep -A 20 environment
```

**Common Causes:**
1. Missing environment variables
2. Database connection failure
3. Port already in use
4. Insufficient permissions

**Resolution:**
```bash
# Fix environment variables
nano /opt/netzwaechter/infrastructure/docker/.env

# Check port conflicts
netstat -tlnp | grep :5000

# Verify database is running
docker compose ps postgres

# Restart with fresh start
docker compose down
docker compose up -d
```

### Database Connection Errors

**Symptoms:** "Connection refused" or "Connection timeout" in backend logs

**Diagnosis:**
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Test database connectivity
docker exec netzwaechter-postgres psql -U postgres -c "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

**Resolution:**
```bash
# Restart PostgreSQL
docker compose restart postgres

# Wait for health check
docker compose ps postgres

# Verify backend can connect
docker compose restart backend
```

### Redis Connection Issues

**Symptoms:** Session errors, authentication failures

**Diagnosis:**
```bash
# Check Redis status
docker compose ps redis

# Check Redis logs
docker compose logs redis

# Test Redis connectivity
docker exec netzwaechter-redis redis-cli ping

# Check Redis authentication
docker exec netzwaechter-redis redis-cli -a $REDIS_PASSWORD ping
```

**Resolution:**
```bash
# Restart Redis
docker compose restart redis

# Clear Redis data if corrupted
docker compose stop redis
docker volume rm docker_redis-data
docker compose up -d redis
```

### Slow Performance

**Symptoms:** Application responds slowly, timeouts

**Diagnosis:**
```bash
# Check resource usage
docker stats

# Check database performance
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter
SELECT * FROM pg_stat_activity WHERE state = 'active';
\q

# Check slow queries
docker compose logs backend | grep "slow query"

# Check cache hit rate
docker exec netzwaechter-redis redis-cli INFO stats | grep keyspace
```

**Resolution:**
```bash
# Optimize database
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter -c "VACUUM ANALYZE;"

# Clear cache
docker exec netzwaechter-redis redis-cli FLUSHDB

# Restart services
docker compose restart

# Scale backend if needed
docker compose up -d --scale backend=2
```

### High Memory Usage

**Symptoms:** Container restarts, OOM errors

**Diagnosis:**
```bash
# Check memory usage
docker stats --no-stream

# Check container logs for OOM
docker compose logs backend | grep -i "out of memory"

# Check Node.js heap usage (if accessible)
docker exec netzwaechter-backend node -e "console.log(process.memoryUsage())"
```

**Resolution:**
```bash
# Restart affected container
docker compose restart backend

# Check for memory leaks in logs
docker compose logs backend | grep -i "memory leak"

# Increase container memory limit (in docker-compose.yml)
# deploy:
#   resources:
#     limits:
#       memory: 2G

# Apply changes
docker compose up -d
```

### Login Issues

**Symptoms:** Users cannot authenticate

**Diagnosis:**
```bash
# Check backend logs for auth errors
docker compose logs backend | grep -i "auth"

# Check session store (Redis)
docker exec netzwaechter-redis redis-cli -a $REDIS_PASSWORD KEYS session:*

# Verify user exists in database
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter -c "SELECT username, email FROM users WHERE username='username';"

# Check SESSION_SECRET is set
docker compose -f /opt/netzwaechter/infrastructure/docker/docker-compose.prod.yml config | grep SESSION_SECRET
```

**Resolution:**
```bash
# Clear sessions
docker exec netzwaechter-redis redis-cli -a $REDIS_PASSWORD FLUSHDB

# Restart backend
docker compose restart backend

# Reset user password (via application UI or database)
```

### SSL Certificate Issues

**Symptoms:** HTTPS not working, certificate warnings

**Diagnosis:**
```bash
# Check certificate expiration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com </dev/null 2>/dev/null | openssl x509 -noout -dates

# Check Nginx configuration
sudo nginx -t

# Check certificate files
sudo ls -la /etc/letsencrypt/live/yourdomain.com/
```

**Resolution:**
```bash
# Renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl reload nginx

# Force renewal if needed
sudo certbot renew --force-renewal
```

## Incident Response

### Incident Response Process

**Phase 1: Detection (0-5 minutes)**
1. Alert received or issue reported
2. Verify the issue is real
3. Assess severity and impact
4. Page on-call engineer for P0/P1

**Phase 2: Triage (5-15 minutes)**
1. Gather initial information
2. Check monitoring dashboards
3. Review recent changes
4. Identify affected users/services
5. Create incident ticket

**Phase 3: Mitigation (15-60 minutes)**
1. Implement quick fix or workaround
2. Restore service availability
3. Monitor for stability
4. Communicate status updates

**Phase 4: Resolution (1-4 hours)**
1. Identify root cause
2. Implement permanent fix
3. Verify resolution
4. Close incident ticket

**Phase 5: Post-Mortem (24-48 hours)**
1. Document timeline
2. Analyze root cause
3. Identify improvements
4. Create action items

### Incident Communication Template

```
INCIDENT NOTIFICATION

Severity: [P0/P1/P2/P3]
Status: [Investigating/Identified/Monitoring/Resolved]
Start Time: [YYYY-MM-DD HH:MM UTC]
Impact: [Description of user impact]

Current Status:
[Brief description of current situation]

Next Update:
[Time of next status update]

Incident Commander: [Name]
```

### Emergency Procedures

**Complete Service Outage:**
```bash
# 1. Check all services
docker compose ps

# 2. Check logs for errors
docker compose logs --tail=100

# 3. Restart all services
docker compose down
docker compose up -d

# 4. Monitor health checks
watch -n 5 'docker compose ps'

# 5. Verify functionality
curl https://yourdomain.com/health
curl https://yourdomain.com/api/users
```

**Database Corruption:**
```bash
# 1. Stop backend to prevent further writes
docker compose stop backend

# 2. Backup current state
docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter > /tmp/corrupted-backup.sql

# 3. Restore from latest good backup
gunzip -c /opt/netzwaechter/backups/latest-backup.sql.gz | \
  docker exec -i netzwaechter-postgres psql -U postgres netzwaechter

# 4. Restart services
docker compose start backend

# 5. Verify data integrity
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter -c "SELECT count(*) FROM users;"
```

**Security Breach:**
```bash
# 1. Immediately isolate system
sudo ufw deny from <suspicious-ip>

# 2. Stop all services
docker compose down

# 3. Preserve evidence
docker compose logs > /tmp/security-incident-logs.txt
sudo tar czf /tmp/docker-volumes.tar.gz /var/lib/docker/volumes/

# 4. Notify security team
# [Contact security team immediately]

# 5. Change all credentials
# [Rotate all passwords and secrets]

# 6. Restore from clean backup
# [Follow recovery procedures]
```

## Maintenance Procedures

### Regular Maintenance Schedule

**Daily:**
- Review error logs
- Check disk space
- Verify backups completed

**Weekly:**
- Review performance metrics
- Clean Docker system: `docker system prune -f`
- Check for security updates

**Monthly:**
- Rotate logs
- Update dependencies
- Review user access
- Test backup restoration
- Performance tuning

**Quarterly:**
- Rotate credentials
- Security audit
- Disaster recovery test
- Capacity planning review

### Planned Maintenance Window

**Pre-Maintenance:**
```bash
# 1. Notify users 48 hours in advance

# 2. Create full backup
/opt/netzwaechter/scripts/backup-database.sh

# 3. Verify backup integrity
gunzip -c /opt/netzwaechter/backups/latest.sql.gz | head -n 100

# 4. Document current state
docker compose ps > pre-maintenance-state.txt
```

**During Maintenance:**
```bash
# 1. Enable maintenance mode (if available)
# Create maintenance page or use Nginx

# 2. Stop services
docker compose down

# 3. Perform maintenance tasks
# [Updates, migrations, etc.]

# 4. Start services
docker compose up -d

# 5. Verify functionality
# Run health checks
```

**Post-Maintenance:**
```bash
# 1. Monitor for issues
docker compose logs -f

# 2. Verify all services healthy
docker compose ps

# 3. Run smoke tests
curl https://yourdomain.com/health
curl https://yourdomain.com/api/users

# 4. Notify users maintenance complete

# 5. Document maintenance performed
```

### Log Rotation

```bash
# Configure Docker log rotation
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker daemon
sudo systemctl restart docker

# Manual log cleanup
docker compose logs --tail=0 -f > /dev/null &
docker system prune -f
```

### Backup Verification

```bash
# Test backup restoration (monthly)
# 1. Create test database
docker exec netzwaechter-postgres psql -U postgres -c "CREATE DATABASE netzwaechter_test;"

# 2. Restore backup to test database
gunzip -c /opt/netzwaechter/backups/latest.sql.gz | \
  docker exec -i netzwaechter-postgres psql -U postgres netzwaechter_test

# 3. Verify data
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter_test -c "SELECT count(*) FROM users;"

# 4. Cleanup
docker exec netzwaechter-postgres psql -U postgres -c "DROP DATABASE netzwaechter_test;"
```

## Performance Optimization

### Database Optimization

```sql
-- Connect to database
docker exec -it netzwaechter-postgres psql -U postgres -d netzwaechter

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;

-- Check bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Cache Optimization

```bash
# Check Redis cache statistics
docker exec netzwaechter-redis redis-cli INFO stats

# Monitor cache hit rate
docker exec netzwaechter-redis redis-cli INFO stats | grep keyspace

# Set cache expiration policies
docker exec netzwaechter-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Container Resource Tuning

```yaml
# Update docker-compose.prod.yml
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

  postgres:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## Emergency Contacts

### On-Call Schedule

Maintain current on-call schedule in:
- PagerDuty/OpsGenie
- Team calendar
- Slack channel topic

### Escalation Path

**Level 1 - On-Call Engineer**
- Initial response
- Basic troubleshooting
- Incident triage

**Level 2 - Senior Engineer**
- Complex issues
- Architecture decisions
- Performance problems

**Level 3 - Engineering Manager**
- Business impact decisions
- External communication
- Resource allocation

**Level 4 - CTO/Security Team**
- Security incidents
- Data breaches
- Critical system failures

### External Contacts

**Hosting Provider:**
- Support: [contact]
- Emergency: [24/7 number]

**Database Provider (if external):**
- Support: [contact]
- Status: [status page URL]

**Security Team:**
- Email: security@company.com
- Emergency: [24/7 number]

## Quick Reference

### Essential Commands

```bash
# Service status
docker compose ps

# View logs
docker compose logs -f backend

# Restart service
docker compose restart backend

# Database backup
docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter | gzip > backup.sql.gz

# Check disk space
df -h

# Monitor resources
docker stats
```

### Common File Locations

- Application: `/opt/netzwaechter`
- Docker Compose: `/opt/netzwaechter/infrastructure/docker`
- Backups: `/opt/netzwaechter/backups`
- Logs: `docker compose logs` (container logs)
- Configuration: `/opt/netzwaechter/infrastructure/docker/.env`

### Port Reference

- Frontend: 80 (HTTP), 443 (HTTPS)
- Backend: 5000
- PostgreSQL: 5432
- Redis: 6379

## Related Documentation

- `PRODUCTION-DEPLOYMENT.md` - Deployment procedures
- `CI-CD-SETUP.md` - Automated deployment
- `TROUBLESHOOTING.md` - Detailed troubleshooting (if exists)
- Application logs - Check container logs for details
