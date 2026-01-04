pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        FRONTEND_DIR = 'client'
        BACKEND_DIR = 'server'
        DOCKER_REGISTRY = 'localhost:5000'
        DOCKER_CREDENTIALS = 'docker-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                script {
                    // Use nvm to install Node.js without root permissions
                    sh '''
                        # Install nvm if not present
                        if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
                            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                        fi
                        
                        # Load nvm
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                        
                        # Install and use Node.js
                        nvm install 18
                        nvm use 18
                        
                        # Verify installation
                        node --version
                        npm --version
                    '''
                }
            }
        }
        
        stage('Setup Environment') {
            parallel {
                stage('Frontend Setup') {
                    steps {
                        script {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                                nvm use 18
                                cd ${FRONTEND_DIR}
                                npm ci
                            '''
                        }
                    }
                }
                stage('Backend Setup') {
                    steps {
                        script {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                                nvm use 18
                                cd ${BACKEND_DIR}
                                npm ci
                            '''
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
                            sh 'npm run lint || true'
                        }
                    }
                }
                stage('Backend Linting') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            sh 'npm run lint || true'
                        }
                    }
                }
                stage('Security Scan') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm audit --audit-level high || true'
                        }
                        dir(env.BACKEND_DIR) {
                            sh 'npm audit --audit-level high || true'
                        }
                    }
                }
            }
        }
        
        stage('Testing') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm run test -- --coverage --watchAll=false || true'
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            sh 'npm run test || true'
                        }
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
                            sh 'npm run build || true'
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
                    
                    // Build frontend Docker image
                    dir(env.FRONTEND_DIR) {
                        sh """
                            docker build -t ${image}-frontend .
                            docker tag ${image}-frontend ${env.DOCKER_REGISTRY}/flowzen-frontend:latest
                            docker push ${env.DOCKER_REGISTRY}/flowzen-frontend:latest
                        """
                    }
                    
                    // Build backend Docker image
                    dir(env.BACKEND_DIR) {
                        sh """
                            docker build -t ${image}-backend .
                            docker tag ${image}-backend ${env.DOCKER_REGISTRY}/flowzen-backend:latest
                            docker push ${env.DOCKER_REGISTRY}/flowzen-backend:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    echo 'Deploying to staging environment...'
                    if (isUnix()) {
                        sh '''
                            chmod +x scripts/deploy-staging.sh
                            ./scripts/deploy-staging.sh
                        '''
                    } else {
                        bat 'scripts\\deploy-staging.bat'
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Deploying to production environment...'
                    if (isUnix()) {
                        sh '''
                            chmod +x scripts/deploy-production.sh
                            ./scripts/deploy-production.sh
                        '''
                    } else {
                        bat 'scripts\\deploy-production.bat'
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Pipeline succeeded for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
        failure {
            echo "❌ Pipeline failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
        unstable {
            echo "⚠️ Pipeline unstable for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
    }
}
