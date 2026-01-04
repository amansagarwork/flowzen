#!/bin/bash

# Deploy to Staging Environment Script
echo "🚀 Deploying FlowZen to Staging Environment..."

# Set variables
ENVIRONMENT="staging"
DOCKER_REGISTRY="localhost:5000"
IMAGE_TAG="develop"

# Build and push Docker images
echo "📦 Building Docker images..."
docker build -t ${DOCKER_REGISTRY}/flowzen-frontend:${IMAGE_TAG} ./client
docker build -t ${DOCKER_REGISTRY}/flowzen-backend:${IMAGE_TAG} ./server

echo "📤 Pushing Docker images..."
docker push ${DOCKER_REGISTRY}/flowzen-frontend:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/flowzen-backend:${IMAGE_TAG}

# Deploy to staging
echo "🌐 Deploying to staging environment..."
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo "🏥 Running health checks..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

if curl -f http://localhost:5000/graphql > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

echo "🎉 Staging deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000/graphql"
