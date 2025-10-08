#!/bin/bash
set -e

echo "🔨 Building Netzwächter Docker images..."

cd $(dirname $0)/../..

echo "Building backend..."
docker build -f infrastructure/docker/Dockerfile.backend -t netzwaechter-backend:latest .

echo "Building frontend..."
docker build -f infrastructure/docker/Dockerfile.frontend -t netzwaechter-frontend:latest .

echo "✅ Build complete!"
docker images | grep netzwaechter
