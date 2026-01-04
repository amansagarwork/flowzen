#!/bin/bash

# Jenkins Setup Script for FlowZen
echo "🚀 Setting up Jenkins for FlowZen CI/CD Pipeline..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create Jenkins network
echo "📡 Creating Jenkins network..."
docker network create jenkins

# Create Jenkins volume
echo "💾 Creating Jenkins volume..."
docker volume create jenkins-data

# Pull Jenkins image
echo "📥 Pulling Jenkins image..."
docker pull jenkins/jenkins:lts

# Create Jenkins container
echo "🏗️ Creating Jenkins container..."
docker run \
  --name jenkins \
  --rm \
  -d \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --network jenkins \
  jenkins/jenkins:lts

echo "⏳ Waiting for Jenkins to start..."
sleep 30

# Check if Jenkins is running
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Jenkins is running on http://localhost:8080"
else
    echo "❌ Jenkins failed to start"
    exit 1
fi

# Get initial admin password
echo "🔑 Getting initial admin password..."
ADMIN_PASSWORD=$(docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword)
echo "Initial Admin Password: $ADMIN_PASSWORD"

echo ""
echo "🎉 Jenkins setup complete!"
echo "📋 Next steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Use the admin password shown above"
echo "3. Install suggested plugins"
echo "4. Create admin user"
echo "5. Install additional plugins: GitHub Integration Plugin, Pipeline Plugin, Blue Ocean Plugin"
echo "6. Configure GitHub credentials"
echo "7. Create pipeline job using the Jenkinsfile"
echo ""
echo "📖 For detailed instructions, see: .windsurf/workflows/jenkins-github-integration.md"
