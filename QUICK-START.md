# 🚀 Quick Start: Local Jenkins Setup

## 📋 5-Minute Setup Guide

### Step 1: Install Docker Desktop (5 minutes)
1. **Download**: https://www.docker.com/products/docker-desktop
2. **Install**: Run installer with WSL 2 backend
3. **Restart**: Your computer
4. **Start**: Docker Desktop from Start Menu

### Step 2: Run Jenkins Setup (2 minutes)
```bash
# Navigate to project
cd d:\Aman\2026-projects\flowzen

# Run setup script
setup-jenkins-windows.bat
```

### Step 3: Configure Jenkins (5 minutes)
1. **Open**: http://localhost:8080
2. **Use admin password** from setup script
3. **Install suggested plugins**
4. **Create admin user**

### Step 4: Add GitHub Integration (3 minutes)
1. **Install plugins**: GitHub Integration, Pipeline, Blue Ocean
2. **Add credentials**: GitHub Personal Access Token
3. **Create pipeline job**: Use your Jenkinsfile

### Step 5: Test Pipeline (1 minute)
```bash
git add .
git commit -m "Test Jenkins pipeline"
git push origin main
```

---

## 🎯 Expected Results

After setup, you'll have:
- ✅ **Jenkins running** at http://localhost:8080
- ✅ **Automated CI/CD pipeline** for FlowZen
- ✅ **Docker-based deployment** system
- ✅ **GitHub webhook integration**
- ✅ **Multi-environment support** (staging/production)

---

## 🔧 If You Get Stuck

### Docker Issues
- Make sure Docker Desktop is running
- Check Windows Subsystem for Linux (WSL 2)

### Jenkins Issues
- Check if port 8080 is available
- Verify Docker containers are running

### Pipeline Issues
- Check Jenkins console output
- Verify GitHub webhook is active

---

## 📞 Need Help?

1. **Detailed Guide**: See `LOCAL-SETUP-GUIDE.md`
2. **Status Report**: See `CI-CD-STATUS.md`
3. **Validation**: Run `groovy validate-jenkinsfile.groovy`

---

**🎉 Your local Jenkins CI/CD pipeline will be ready in 15 minutes!**
