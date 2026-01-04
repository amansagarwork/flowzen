@echo off
echo 🚀 Setting up Jenkins for FlowZen CI/CD Pipeline...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed.
    echo.
    echo 📋 To install Docker Desktop for Windows:
    echo 1. Go to: https://www.docker.com/products/docker-desktop
    echo 2. Download Docker Desktop for Windows
    echo 3. Run the installer with WSL 2 backend
    echo 4. Restart your computer
    echo 5. Start Docker Desktop from Start Menu
    echo.
    echo 🔄 After installing Docker, run this script again.
    pause
    exit /b 1
)

echo ✅ Docker is installed and running

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed.
    echo 🔄 Docker Compose should be included with Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker Compose is available

REM Create Jenkins network
echo 📡 Creating Jenkins network...
docker network create jenkins

REM Create Jenkins volume
echo 💾 Creating Jenkins volume...
docker volume create jenkins-data

REM Pull Jenkins image
echo 📥 Pulling Jenkins image...
docker pull jenkins/jenkins:lts

REM Create Jenkins container
echo 🏗️ Creating Jenkins container...
docker run ^
  --name jenkins ^
  --rm ^
  -d ^
  -p 8080:8080 ^
  -p 50000:50000 ^
  -v jenkins-data:/var/jenkins_home ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  --network jenkins ^
  jenkins/jenkins:lts

echo ⏳ Waiting for Jenkins to start...
timeout /t 30 /nobreak >nul

REM Check if Jenkins is running
curl -f http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Jenkins is running on http://localhost:8080
) else (
    echo ❌ Jenkins failed to start
    pause
    exit /b 1
)

REM Get initial admin password
echo 🔑 Getting initial admin password...
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

echo.
echo 🎉 Jenkins setup complete!
echo 📋 Next steps:
echo 1. Open http://localhost:8080 in your browser
echo 2. Use the admin password shown above
echo 3. Install suggested plugins
echo 4. Create admin user
echo 5. Install additional plugins: GitHub Integration Plugin, Pipeline Plugin, Blue Ocean Plugin
echo 6. Configure GitHub credentials
echo 7. Create pipeline job using the Jenkinsfile
echo.
echo 📖 For detailed instructions, see: README-CICD.md
pause
