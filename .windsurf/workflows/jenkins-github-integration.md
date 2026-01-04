---
description: Complete Jenkins-GitHub CI/CD Integration Workflow for FlowZen
---

# Jenkins-GitHub Integration Workflow

This workflow implements a complete CI/CD pipeline for FlowZen using Jenkins and GitHub integration, following the best practices from the GeeksforGeeks article.

## Overview

This workflow automates the entire development lifecycle:
- **Continuous Integration**: Automated testing and building on every commit
- **Continuous Deployment**: Automated deployment to staging/production
- **Quality Gates**: Code quality checks and security scanning
- **Branch Strategies**: Different behaviors for different branches

## Prerequisites

### 1. Jenkins Setup
- Jenkins server installed and running
- Required plugins installed:
  - GitHub Integration Plugin
  - Pipeline Plugin
  - GitHub Plugin
  - Blue Ocean Plugin
  - Credentials Binding Plugin

### 2. GitHub Setup
- GitHub repository created
- Personal Access Token generated
- Webhooks configured

### 3. Environment Setup
- Node.js environment for frontend
- PostgreSQL for backend
- Docker (optional for containerization)

## Step-by-Step Implementation

### Phase 1: Jenkins Configuration

#### Step 1: Install Jenkins
```bash
# Install Jenkins (Ubuntu/Debian)
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
echo deb https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt-get update
sudo apt-get install jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

#### Step 2: Install Required Plugins
1. Navigate to `Manage Jenkins` → `Manage Plugins`
2. Install these plugins:
   - GitHub Integration Plugin
   - Pipeline Plugin
   - GitHub Plugin
   - Blue Ocean Plugin
   - Credentials Binding Plugin
   - NodeJS Plugin
   - Docker Pipeline Plugin

#### Step 3: Configure GitHub Credentials
1. Go to `Manage Jenkins` → `Manage Credentials`
2. Add GitHub Personal Access Token:
   - Kind: `Username with password`
   - Username: Your GitHub username
   - Password: Your GitHub Personal Access Token
   - ID: `github-credentials`

### Phase 2: GitHub Repository Setup

#### Step 4: Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with these scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
   - `user` (Read user profile data)

#### Step 5: Configure GitHub Webhook
1. Go to your repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://your-jenkins-server:8080/github-webhook/`
   - Content type: `application/json`
   - Secret: (optional webhook secret)
   - Events: `Pushes`, `Pull requests`

### Phase 3: Jenkins Pipeline Configuration

#### Step 6: Create Jenkinsfile
Create a `Jenkinsfile` in your FlowZen repository root:

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        FRONTEND_DIR = 'client'
        BACKEND_DIR = 'server'
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_CREDENTIALS = 'docker-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            parallel {
                stage('Frontend Setup') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Backend Setup') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Frontend Linting') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Backend Linting') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Security Scan') {
                    steps {
                        sh 'npm audit --audit-level high'
                    }
                }
            }
        }
        
        stage('Testing') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm run test -- --coverage --watchAll=false'
                        }
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'client/coverage',
                            reportFiles: 'lcov-report/index.html',
                            reportName: 'Frontend Coverage Report'
                        ])
                    }
                }
                stage('Backend Tests') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            sh 'npm run test'
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Frontend Build') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm run build'
                        }
                        archiveArtifacts artifacts: 'client/dist/**/*', fingerprint: true
                    }
                }
                stage('Backend Build') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                script {
                    def image = env.BRANCH_NAME == 'main' ? 
                        "${env.DOCKER_REGISTRY}/flowzen:latest" : 
                        "${env.DOCKER_REGISTRY}/flowzen:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    
                    docker.withRegistry("https://${env.DOCKER_REGISTRY}", env.DOCKER_CREDENTIALS) {
                        def customImage = docker.build(image)
                        customImage.push()
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy to production
                    sh '''
                        kubectl set image deployment/flowzen-frontend flowzen-frontend=your-registry.com/flowzen:latest
                        kubectl set image deployment/flowzen-backend flowzen-backend=your-registry.com/flowzen:latest
                        kubectl rollout status deployment/flowzen-frontend
                        kubectl rollout status deployment/flowzen-backend
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    // Deploy to staging
                    sh '''
                        kubectl set image deployment/flowzen-staging-frontend flowzen-staging-frontend=your-registry.com/flowzen:develop
                        kubectl set image deployment/flowzen-staging-backend flowzen-staging-backend=your-registry.com/flowzen:develop
                        kubectl rollout status deployment/flowzen-staging-frontend
                        kubectl rollout status deployment/flowzen-staging-backend
                    '''
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: '#ci-cd',
                color: 'good',
                message: "✅ Pipeline succeeded for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
        failure {
            slackSend(
                channel: '#ci-cd',
                color: 'danger',
                message: "❌ Pipeline failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
        unstable {
            slackSend(
                channel: '#ci-cd',
                color: 'warning',
                message: "⚠️ Pipeline unstable for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
    }
}
```

#### Step 7: Create Jenkins Job
1. Go to Jenkins Dashboard
2. Click "New Item"
3. Enter name: `flowzen-pipeline`
4. Select "Pipeline"
5. Configure:
   - **GitHub Project**: Check and add repository URL
   - **Pipeline**: Select "Pipeline script from SCM"
   - **SCM**: Git
   - **Repository URL**: Your GitHub repository URL
   - **Credentials**: Select GitHub credentials
   - **Script Path**: `Jenkinsfile`

### Phase 4: Branch Strategy Implementation

#### Step 8: Configure Branch-Specific Behavior

**Main Branch (Production)**
- Full pipeline execution
- Automated deployment to production
- Security scans
- Performance tests

**Develop Branch (Staging)**
- Full pipeline execution
- Deployment to staging environment
- Integration tests

**Feature Branches**
- Basic pipeline (lint, test, build)
- No deployment
- Pull request validation

**Hotfix Branches**
- Fast-tracked pipeline
- Deployment to production after approval

### Phase 5: Advanced Features

#### Step 9: Multi-Environment Configuration

Create environment-specific configuration files:

```groovy
// environments/production.groovy
def config = [
    database_url: 'postgresql://prod-user:password@prod-db:5432/flowzen-prod',
    jwt_secret: 'prod-jwt-secret',
    google_client_id: 'prod-google-client-id',
    node_env: 'production'
]

// environments/staging.groovy
def config = [
    database_url: 'postgresql://staging-user:password@staging-db:5432/flowzen-staging',
    jwt_secret: 'staging-jwt-secret',
    google_client_id: 'staging-google-client-id',
    node_env: 'staging'
]
```

#### Step 10: Monitoring and Alerting

Configure monitoring and alerting:

```groovy
// Add to Jenkinsfile
stage('Health Check') {
    steps {
        script {
            def healthCheck = sh(
                script: 'curl -f http://your-app.com/health || exit 1',
                returnStatus: true
            )
            if (healthCheck != 0) {
                error 'Health check failed'
            }
        }
    }
}
```

## Testing the Workflow

### Manual Testing
1. Push changes to different branches
2. Create pull requests
3. Verify pipeline execution
4. Check deployment status

### Automated Testing
1. Unit tests for Jenkins pipeline
2. Integration tests for deployment
3. End-to-end tests for the application

## Troubleshooting

### Common Issues

**Webhook Not Triggering**
- Check Jenkins server accessibility
- Verify webhook URL and secret
- Check Jenkins logs

**Build Failures**
- Check node_modules installation
- Verify environment variables
- Review test logs

**Deployment Issues**
- Check Kubernetes cluster connectivity
- Verify image registry access
- Review deployment logs

### Debug Commands

```bash
# Check Jenkins logs
sudo tail -f /var/log/jenkins/jenkins.log

# Check webhook delivery
curl -X POST -H "Content-Type: application/json" \
  -d '{"zen":"GitHub webhook test"}' \
  http://your-jenkins-server:8080/github-webhook/

# Test pipeline locally
docker run -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock jenkins/jenkins:lts
```

## Best Practices

1. **Security**: Use credential management for all secrets
2. **Performance**: Parallelize stages where possible
3. **Reliability**: Implement retry logic for flaky operations
4. **Monitoring**: Add comprehensive logging and metrics
5. **Documentation**: Keep pipeline documentation up to date

## Maintenance

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

This workflow provides a comprehensive CI/CD pipeline that follows industry best practices and integrates seamlessly with your FlowZen application architecture.
