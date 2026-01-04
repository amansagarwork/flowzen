# FlowZen CI/CD Pipeline Setup

This document provides step-by-step instructions to set up the complete Jenkins-GitHub CI/CD pipeline for FlowZen.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git installed
- GitHub account with repository access
- Administrator access to install Jenkins

### 1. Setup Jenkins

#### Option A: Using Docker (Recommended)
```bash
# Run the setup script
./setup-jenkins.sh
```

#### Option B: Manual Setup
```bash
# Create Jenkins network
docker network create jenkins

# Create Jenkins volume
docker volume create jenkins-data

# Run Jenkins container
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
```

### 2. Configure Jenkins

1. **Access Jenkins**: Open http://localhost:8080
2. **Initial Setup**: Use the admin password from setup script
3. **Install Plugins**: Install suggested plugins plus:
   - GitHub Integration Plugin
   - Pipeline Plugin
   - Blue Ocean Plugin
   - Docker Pipeline Plugin
   - NodeJS Plugin

### 3. Setup GitHub Integration

#### Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
   - `user` (Read user profile data)

#### Configure Jenkins Credentials
1. Go to `Manage Jenkins` → `Manage Credentials`
2. Add GitHub credentials:
   - Kind: `Username with password`
   - Username: Your GitHub username
   - Password: Your GitHub Personal Access Token
   - ID: `github-credentials`

#### Setup GitHub Webhook
1. Go to your repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://your-jenkins-server:8080/github-webhook/`
   - Content type: `application/json`
   - Events: `Pushes`, `Pull requests`

### 4. Create Jenkins Pipeline

1. **Create New Job**:
   - Go to Jenkins Dashboard → New Item
   - Name: `flowzen-pipeline`
   - Type: `Pipeline`

2. **Configure Pipeline**:
   - **GitHub Project**: Check and add repository URL
   - **Pipeline**: Select "Pipeline script from SCM"
   - **SCM**: Git
   - **Repository URL**: Your GitHub repository URL
   - **Credentials**: Select GitHub credentials
   - **Script Path**: `Jenkinsfile`

### 5. Environment Setup

Create `.env` file in project root:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Production
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
```

### 6. Test the Pipeline

1. **Push Changes**:
   ```bash
   git add .
   git commit -m "Add Jenkins CI/CD pipeline"
   git push origin main
   ```

2. **Monitor Build**:
   - Go to Jenkins Dashboard
   - Click on `flowzen-pipeline`
   - Watch the build progress

## 📋 Pipeline Stages

### 1. **Checkout**
- Pulls latest code from GitHub

### 2. **Setup Environment**
- Installs dependencies for frontend and backend
- Runs in parallel for faster execution

### 3. **Code Quality**
- Runs linting for both frontend and backend
- Performs security audit
- Checks for vulnerabilities

### 4. **Testing**
- Runs unit tests
- Generates coverage reports
- Runs integration tests

### 5. **Build**
- Builds frontend application
- Builds backend application
- Archives build artifacts

### 6. **Docker Build**
- Creates Docker images
- Pushes to registry
- Tags appropriately for environment

### 7. **Deploy**
- Deploys to staging (develop branch)
- Deploys to production (main branch)

## 🌍 Environments

### Development
- Triggered on feature branches
- Runs tests and builds only
- No deployment

### Staging
- Triggered on develop branch
- Full pipeline execution
- Deploys to staging environment
- URL: http://localhost:3001

### Production
- Triggered on main branch
- Full pipeline execution
- Deploys to production environment
- URL: http://localhost:3000

## 🛠️ Local Development

### Run with Docker Compose
```bash
# Development environment
docker-compose up -d

# Staging environment
docker-compose -f docker-compose.staging.yml up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment Scripts
```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh
```

## 📊 Monitoring

### Jenkins Dashboard
- Build history
- Console output
- Test results
- Coverage reports

### Health Checks
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/graphql
- Staging: http://localhost:3001

## 🔧 Troubleshooting

### Common Issues

**Build Fails on Dependencies**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Docker Build Fails**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Jenkins Webhook Not Working**
1. Check Jenkins server accessibility
2. Verify webhook URL and secret
3. Check Jenkins logs

**Database Connection Issues**
```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres
```

### Debug Commands

```bash
# Check Jenkins logs
docker logs jenkins

# Check build logs
docker logs flowzen-backend
docker logs flowzen-frontend

# Test database connection
docker-compose exec postgres psql -U postgres -d flowzen-v1
```

## 📈 Best Practices

1. **Security**: Use credential management for all secrets
2. **Performance**: Parallelize stages where possible
3. **Reliability**: Implement retry logic for flaky operations
4. **Monitoring**: Add comprehensive logging and metrics
5. **Documentation**: Keep pipeline documentation up to date

## 🔄 Maintenance

### Regular Tasks
- Update Jenkins plugins monthly
- Review and rotate credentials
- Monitor pipeline performance
- Update dependencies

### Scaling Considerations
- Use Jenkins agents for distributed builds
- Implement build caching
- Optimize Docker layer caching
- Consider Kubernetes-based Jenkins deployment

## 📞 Support

For issues and questions:
1. Check the [Jenkins documentation](https://jenkins.io/doc/)
2. Review the [GitHub Integration Plugin docs](https://plugins.jenkins.io/github/)
3. Check the pipeline logs in Jenkins
4. Review this documentation for common solutions

---

## 🎉 Success!

Once completed, you'll have:
- ✅ Automated testing on every commit
- ✅ Automated building and deployment
- ✅ Environment-specific deployments
- ✅ Quality gates and security scanning
- ✅ Monitoring and alerting
- ✅ Scalable CI/CD pipeline

Your FlowZen application will be ready for continuous integration and deployment! 🚀
