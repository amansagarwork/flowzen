# Local Jenkins Setup Guide

## 🚀 Setup Jenkins on Your Local System

### Prerequisites

1. **Docker Desktop for Windows** (Free)
   - Download: https://www.docker.com/products/docker-desktop
   - Install with WSL 2 backend (recommended)

2. **Git** (Already installed)
   - Verify: `git --version`

3. **Windows PowerShell or Command Prompt**

---

## 📋 Step-by-Step Setup

### Step 1: Install Docker Desktop

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop
   - Download "Docker Desktop for Windows"
   - Run the installer

2. **Configure Docker**
   - Choose "Use WSL 2 backend" (recommended)
   - Restart your computer when prompted
   - Start Docker Desktop from Start Menu

3. **Verify Docker Installation**
   ```bash
   # Open PowerShell or Command Prompt
   docker --version
   docker-compose --version
   ```

### Step 2: Setup Jenkins

1. **Run the Setup Script**
   ```bash
   # Navigate to your project directory
   cd d:\Aman\2026-projects\flowzen
   
   # Run the Windows setup script
   setup-jenkins-windows.bat
   ```

2. **Wait for Jenkins to Start**
   - The script will show progress
   - Wait for "Jenkins setup complete!" message
   - Note the admin password displayed

### Step 3: Configure Jenkins

1. **Access Jenkins**
   - Open: http://localhost:8080
   - Use the admin password from the setup script

2. **Install Plugins**
   - Click "Install suggested plugins"
   - Wait for installation to complete

3. **Create Admin User**
   - Fill in your details
   - Save and continue

4. **Install Additional Plugins**
   - Go to "Manage Jenkins" → "Plugins"
   - Install these plugins:
     - GitHub Integration Plugin
     - Pipeline Plugin
     - Blue Ocean Plugin
     - Docker Pipeline Plugin
     - NodeJS Plugin

### Step 4: Configure GitHub Integration

1. **Create GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with scopes:
     - `repo` (Full control of private repositories)
     - `admin:repo_hook` (Full control of repository hooks)
     - `user` (Read user profile data)

2. **Add GitHub Credentials in Jenkins**
   - Go to "Manage Jenkins" → "Manage Credentials"
   - Click "Add credentials"
   - Kind: "Username with password"
   - Username: Your GitHub username
   - Password: Your GitHub Personal Access Token
   - ID: `github-credentials`

### Step 5: Setup GitHub Webhook

1. **Go to Your Repository**
   - Repository → Settings → Webhooks
   - Click "Add webhook"

2. **Configure Webhook**
   - Payload URL: `http://localhost:8080/github-webhook/`
   - Content type: `application/json`
   - Secret: Leave empty for now
   - Events: Check "Pushes" and "Pull requests"
   - Click "Add webhook"

### Step 6: Create Jenkins Pipeline

1. **Create New Job**
   - Jenkins Dashboard → "New Item"
   - Name: `flowzen-pipeline`
   - Type: `Pipeline`
   - Click "OK"

2. **Configure Pipeline**
   - **GitHub Project**: Check and add your repository URL
   - **Pipeline**: Select "Pipeline script from SCM"
   - **SCM**: Git
   - **Repository URL**: Your GitHub repository URL
   - **Credentials**: Select your GitHub credentials
   - **Script Path**: `Jenkinsfile`

3. **Save Configuration**
   - Click "Save" at the bottom

---

## 🧪 Test the Pipeline

### Test with a Commit

1. **Make a Change**
   ```bash
   cd d:\Aman\2026-projects\flowzen
   echo "# Testing Jenkins pipeline" >> README.md
   git add .
   git commit -m "Test Jenkins CI/CD pipeline"
   git push origin main
   ```

2. **Monitor Build**
   - Go to Jenkins Dashboard
   - Click on `flowzen-pipeline`
   - Watch the build progress
   - Check "Console Output" for details

### Expected Pipeline Flow

1. **Checkout** - Pulls code from GitHub ✅
2. **Setup Environment** - Installs dependencies ✅
3. **Code Quality** - Runs linting and security checks ✅
4. **Testing** - Runs unit tests ✅
5. **Build** - Compiles frontend and backend ✅
6. **Docker Build** - Creates Docker images ✅
7. **Deploy** - Deploys to staging/production ✅

---

## 🔧 Troubleshooting

### Docker Issues

**Docker not starting**
```bash
# Restart Docker Desktop
# Check Windows Subsystem for Linux
wsl --install
```

**Permission denied**
```bash
# Make sure Docker Desktop is running
# Check Docker daemon status
docker info
```

### Jenkins Issues

**Jenkins not accessible**
```bash
# Check if Jenkins container is running
docker ps | grep jenkins

# Check Jenkins logs
docker logs jenkins
```

**Plugin installation failed**
- Try installing plugins one by one
- Restart Jenkins if needed

### Pipeline Issues

**Build fails on dependencies**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Docker build fails**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

---

## 📊 Local Environment URLs

Once everything is running:

- **Jenkins**: http://localhost:8080
- **FlowZen Frontend**: http://localhost:3000
- **FlowZen Backend**: http://localhost:5000/graphql
- **Docker Registry**: http://localhost:5000

---

## 🎯 Success Indicators

You'll know everything is working when:

1. ✅ Docker Desktop is running
2. ✅ Jenkins is accessible at http://localhost:8080
3. ✅ Pipeline job is created and configured
4. ✅ GitHub webhook is active
5. ✅ First pipeline run completes successfully
6. ✅ FlowZen application is running locally

---

## 🚀 Next Steps After Setup

1. **Test the complete pipeline** with different branches
2. **Configure environment variables** for production
3. **Set up monitoring** and alerting
4. **Optimize pipeline** for faster builds
5. **Add more tests** and quality checks

---

## 📞 Help and Support

If you encounter issues:

1. Check this guide first
2. Review Jenkins console output
3. Check Docker logs
4. Verify GitHub webhook status
5. Test individual components separately

**Your local Jenkins CI/CD pipeline will be ready for production use!** 🎉
