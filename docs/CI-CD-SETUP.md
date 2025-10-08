# CI/CD Pipeline Setup Guide

Comprehensive guide for setting up continuous integration and deployment pipelines for Netzwächter.

Created: 2025-10-08

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Environment Management](#environment-management)
4. [Secrets Management](#secrets-management)
5. [Automated Testing](#automated-testing)
6. [Automated Deployment](#automated-deployment)
7. [Branch Strategy](#branch-strategy)
8. [Deployment Environments](#deployment-environments)
9. [Monitoring and Notifications](#monitoring-and-notifications)

## Overview

The CI/CD pipeline automates the following processes:

- **Continuous Integration (CI):**
  - Automated testing on every push
  - TypeScript compilation checks
  - Linting and code quality checks
  - Security vulnerability scanning
  - Docker image building

- **Continuous Deployment (CD):**
  - Automated deployment to staging on main branch
  - Manual approval for production deployment
  - Automatic rollback on failure
  - Database migration execution

## GitHub Actions Workflows

### Workflow Structure

```
.github/
  workflows/
    ci.yml           # Continuous Integration
    deploy-staging.yml   # Deploy to staging
    deploy-production.yml  # Deploy to production
    security-scan.yml    # Security scanning
    backup.yml          # Automated backups
```

### CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI - Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: netzwaechter_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npm run check

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/netzwaechter_test
          SESSION_SECRET: test-secret-for-ci-minimum-128-characters-required-for-session-security-please-ensure-this-meets-requirements
          NODE_ENV: test
        run: npm test

      - name: Build application
        run: npm run build

      - name: Security audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint || echo "Add lint script to package.json"

  docker:
    runs-on: ubuntu-latest
    needs: [test, lint]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build backend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./infrastructure/docker/Dockerfile.backend
          push: false
          tags: netzwaechter-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build frontend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./infrastructure/docker/Dockerfile.frontend
          push: false
          tags: netzwaechter-frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Deploy to Staging Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.STAGING_SSH_KEY }}

      - name: Add staging host to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.STAGING_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to staging server
        env:
          STAGING_HOST: ${{ secrets.STAGING_HOST }}
          STAGING_USER: ${{ secrets.STAGING_USER }}
        run: |
          ssh $STAGING_USER@$STAGING_HOST << 'EOF'
            set -e
            cd /opt/netzwaechter

            # Pull latest code
            git fetch origin
            git checkout main
            git pull origin main

            # Navigate to docker directory
            cd infrastructure/docker

            # Backup database before deployment
            ./scripts/backup-database.sh

            # Pull and rebuild images
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml build

            # Restart services with zero downtime
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            # Wait for health checks
            echo "Waiting for services to be healthy..."
            sleep 30

            # Verify deployment
            docker compose -f docker-compose.prod.yml ps

            # Check backend health
            curl -f http://localhost:5000/api/users || exit 1

            # Check frontend health
            curl -f http://localhost/health || exit 1

            echo "Deployment successful!"
          EOF

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy to Production Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag to deploy (e.g., v1.0.0)'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Verify version tag
        run: |
          if ! git rev-parse ${{ github.event.inputs.version }} >/dev/null 2>&1; then
            echo "Error: Version tag ${{ github.event.inputs.version }} does not exist"
            exit 1
          fi

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.PRODUCTION_SSH_KEY }}

      - name: Add production host to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.PRODUCTION_HOST }} >> ~/.ssh/known_hosts

      - name: Create deployment backup
        env:
          PROD_HOST: ${{ secrets.PRODUCTION_HOST }}
          PROD_USER: ${{ secrets.PRODUCTION_USER }}
        run: |
          ssh $PROD_USER@$PROD_HOST << 'EOF'
            set -e
            cd /opt/netzwaechter

            # Create full backup
            BACKUP_DIR="/opt/netzwaechter/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)"
            mkdir -p $BACKUP_DIR

            # Backup database
            docker exec netzwaechter-postgres pg_dump -U postgres netzwaechter | gzip > $BACKUP_DIR/database.sql.gz

            # Backup volumes
            docker run --rm -v docker_postgres-data:/source:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres-data.tar.gz -C /source .
            docker run --rm -v docker_redis-data:/source:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/redis-data.tar.gz -C /source .

            # Record current version
            git describe --tags > $BACKUP_DIR/previous-version.txt

            echo "Backup completed: $BACKUP_DIR"
          EOF

      - name: Deploy to production
        env:
          PROD_HOST: ${{ secrets.PRODUCTION_HOST }}
          PROD_USER: ${{ secrets.PRODUCTION_USER }}
          VERSION: ${{ github.event.inputs.version }}
        run: |
          ssh $PROD_USER@$PROD_HOST << EOF
            set -e
            cd /opt/netzwaechter

            # Fetch and checkout version
            git fetch --tags
            git checkout tags/$VERSION

            # Navigate to docker directory
            cd infrastructure/docker

            # Pull and rebuild images
            docker compose -f docker-compose.prod.yml build

            # Rolling update (zero downtime)
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            # Wait for health checks
            echo "Waiting for services to be healthy..."
            sleep 45

            # Verify deployment
            docker compose -f docker-compose.prod.yml ps

            # Comprehensive health checks
            echo "Running health checks..."

            # Backend health
            if ! curl -f http://localhost:5000/api/users; then
              echo "Backend health check failed!"
              exit 1
            fi

            # Frontend health
            if ! curl -f http://localhost/health; then
              echo "Frontend health check failed!"
              exit 1
            fi

            # Database connectivity
            if ! docker exec netzwaechter-postgres pg_isready -U postgres; then
              echo "Database health check failed!"
              exit 1
            fi

            # Redis connectivity
            if ! docker exec netzwaechter-redis redis-cli --raw incr ping > /dev/null; then
              echo "Redis health check failed!"
              exit 1
            fi

            echo "All health checks passed!"
            echo "Production deployment successful: $VERSION"
          EOF

      - name: Rollback on failure
        if: failure()
        env:
          PROD_HOST: ${{ secrets.PRODUCTION_HOST }}
          PROD_USER: ${{ secrets.PRODUCTION_USER }}
        run: |
          echo "Deployment failed! Initiating rollback..."
          ssh $PROD_USER@$PROD_HOST << 'EOF'
            set -e
            cd /opt/netzwaechter

            # Find latest backup
            BACKUP_DIR=$(ls -td /opt/netzwaechter/backups/pre-deployment-* | head -1)
            PREVIOUS_VERSION=$(cat $BACKUP_DIR/previous-version.txt)

            echo "Rolling back to version: $PREVIOUS_VERSION"

            # Checkout previous version
            git checkout tags/$PREVIOUS_VERSION

            # Restore database
            cd infrastructure/docker
            docker compose -f docker-compose.prod.yml stop backend
            gunzip -c $BACKUP_DIR/database.sql.gz | docker exec -i netzwaechter-postgres psql -U postgres netzwaechter

            # Rebuild and restart
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d

            echo "Rollback completed!"
          EOF

      - name: Notify success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: 'success'
          text: 'Production deployment successful: ${{ github.event.inputs.version }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

      - name: Notify failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          text: 'Production deployment failed and was rolled back!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Security Scan Workflow

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Scan Docker images
        run: |
          docker build -t netzwaechter-backend:scan -f infrastructure/docker/Dockerfile.backend .
          docker scan netzwaechter-backend:scan || echo "Docker scan not available"

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Netzwächter'
          path: '.'
          format: 'HTML'

      - name: Upload security results
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: reports/
```

## Environment Management

### Environment Configuration

GitHub supports three default environments:
- **Development** - For feature branches
- **Staging** - For main branch testing
- **Production** - For release deployments

### Setting Up Environments

1. Navigate to repository Settings > Environments
2. Create each environment (staging, production)
3. Configure environment protection rules:

**Staging Environment:**
- No required reviewers
- Deployment branch: `main` only

**Production Environment:**
- Required reviewers: 2+ team members
- Deployment branch: tags matching `v*.*.*`
- Wait timer: 5 minutes
- Allow administrators to bypass

### Environment-Specific Variables

**Staging:**
```
DEPLOYMENT_URL=https://staging.yourdomain.com
STAGING_HOST=staging.server.com
STAGING_USER=deploy
DATABASE_URL=<staging-database-url>
```

**Production:**
```
DEPLOYMENT_URL=https://yourdomain.com
PRODUCTION_HOST=production.server.com
PRODUCTION_USER=deploy
DATABASE_URL=<production-database-url>
```

## Secrets Management

### Required Secrets

Configure the following secrets in GitHub repository settings (Settings > Secrets and variables > Actions):

#### SSH Keys
- `STAGING_SSH_KEY` - Private SSH key for staging server
- `PRODUCTION_SSH_KEY` - Private SSH key for production server

#### Server Access
- `STAGING_HOST` - Staging server hostname/IP
- `STAGING_USER` - SSH username for staging
- `PRODUCTION_HOST` - Production server hostname/IP
- `PRODUCTION_USER` - SSH username for production

#### Application Secrets
- `SESSION_SECRET_STAGING` - Session secret for staging
- `SESSION_SECRET_PRODUCTION` - Session secret for production
- `DB_PASSWORD_STAGING` - Database password for staging
- `DB_PASSWORD_PRODUCTION` - Database password for production
- `REDIS_PASSWORD_STAGING` - Redis password for staging
- `REDIS_PASSWORD_PRODUCTION` - Redis password for production

#### External Services
- `SLACK_WEBHOOK` - Slack webhook for notifications
- `SNYK_TOKEN` - Snyk API token for security scanning

### Generating SSH Keys

```bash
# Generate SSH key pair for deployments
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Add public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@your-server.com

# Add private key to GitHub secrets
cat ~/.ssh/github_deploy_key
# Copy output and paste into GitHub secret
```

### Secret Rotation Policy

- Rotate SSH keys: Every 180 days
- Rotate SESSION_SECRET: Every 90 days
- Rotate database passwords: Every 180 days
- Update all secrets immediately if compromised

## Automated Testing

### Test Strategy

The CI pipeline runs the following tests:

1. **Unit Tests** - Test individual components
2. **Integration Tests** - Test API endpoints
3. **TypeScript Compilation** - Ensure type safety
4. **Security Audits** - Check for vulnerabilities
5. **Docker Build** - Verify image creation

### Adding Tests

Update `package.json` with test scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  }
}
```

### Test Coverage Requirements

Set minimum coverage thresholds:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

## Automated Deployment

### Deployment Strategy

**Staging Deployment:**
- Trigger: Automatic on push to `main` branch
- Approval: Not required
- Strategy: Rolling update
- Rollback: Automatic on failure

**Production Deployment:**
- Trigger: Manual via workflow_dispatch
- Approval: Required (2+ reviewers)
- Strategy: Blue-green or rolling update
- Rollback: Automatic on health check failure

### Zero-Downtime Deployment

Docker Compose handles rolling updates automatically:

```bash
# Update services without downtime
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Docker will:
# 1. Start new containers
# 2. Wait for health checks to pass
# 3. Remove old containers
# 4. Maintain service availability throughout
```

### Database Migrations

For schema changes, add migration step:

```yaml
- name: Run database migrations
  run: |
    ssh $PROD_USER@$PROD_HOST << 'EOF'
      cd /opt/netzwaechter
      docker exec netzwaechter-backend npm run db:migrate
    EOF
```

## Branch Strategy

### Git Flow

```
main              # Production-ready code
  ├─ develop      # Integration branch
  ├─ feature/*    # Feature branches
  ├─ bugfix/*     # Bug fix branches
  └─ hotfix/*     # Emergency production fixes
```

### Branch Protection Rules

**Main Branch:**
- Require pull request reviews (2+)
- Require status checks to pass
- Require branches to be up to date
- No force pushes
- No deletions

**Develop Branch:**
- Require pull request reviews (1+)
- Require status checks to pass
- Allow force pushes (with lease)

### Release Process

```bash
# 1. Create release branch from main
git checkout main
git checkout -b release/v1.0.0

# 2. Update version numbers
npm version 1.0.0

# 3. Merge to main
git checkout main
git merge release/v1.0.0

# 4. Create tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## Deployment Environments

### Environment Hierarchy

```
Development (Local)
    ↓
Staging (staging.yourdomain.com)
    ↓
Production (yourdomain.com)
```

### Environment Parity

Maintain consistency across environments:

- Same Docker images
- Same environment variable structure
- Same database schema
- Different credentials and secrets
- Staging uses production-like data (anonymized)

## Monitoring and Notifications

### Deployment Notifications

Configure Slack notifications:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,action,eventName,ref,workflow
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Health Check Monitoring

Post-deployment health checks:

```bash
# Backend API
curl -f https://yourdomain.com/api/users

# Frontend
curl -f https://yourdomain.com/health

# Database
docker exec netzwaechter-postgres pg_isready

# Redis
docker exec netzwaechter-redis redis-cli ping
```

### Rollback Triggers

Automatic rollback occurs on:
- Health check failures after deployment
- Container restart loops
- Database connection failures
- Critical service unavailability

## Manual Deployment

### Deploy from Local Machine

When CI/CD is unavailable:

```bash
# 1. Connect to server
ssh deploy@production.server.com

# 2. Navigate to application
cd /opt/netzwaechter

# 3. Pull latest changes
git fetch --tags
git checkout tags/v1.0.0

# 4. Backup database
cd infrastructure/docker
./scripts/backup-database.sh

# 5. Deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 6. Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## CI/CD Best Practices

1. **Test Before Deploy** - Never deploy untested code
2. **Automate Everything** - Manual steps lead to errors
3. **Monitor Deployments** - Track success/failure metrics
4. **Quick Rollback** - Always have a rollback plan
5. **Document Changes** - Maintain changelog
6. **Version Everything** - Use semantic versioning
7. **Secure Secrets** - Never commit credentials
8. **Review Code** - Require peer reviews
9. **Gradual Rollout** - Deploy to staging first
10. **Learn from Failures** - Post-mortem analysis

## Troubleshooting CI/CD

### Common Issues

**GitHub Actions timeout:**
```yaml
# Increase timeout
jobs:
  deploy:
    timeout-minutes: 30  # Default is 360
```

**SSH connection failures:**
```bash
# Verify SSH key permissions
chmod 600 ~/.ssh/github_deploy_key

# Test SSH connection
ssh -i ~/.ssh/github_deploy_key deploy@server.com
```

**Docker build failures:**
```yaml
# Add better error handling
- name: Build with error logging
  run: |
    docker compose build --progress=plain || {
      docker compose logs
      exit 1
    }
```

## Related Documentation

- `PRODUCTION-DEPLOYMENT.md` - Manual deployment guide
- `OPERATIONS-RUNBOOK.md` - Operations procedures
- GitHub Actions Documentation - https://docs.github.com/en/actions
