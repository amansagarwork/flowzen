@echo off
echo 🚀 Deploying FlowZen to Production Environment...

REM Set variables
set ENVIRONMENT=production
set DOCKER_REGISTRY=localhost:5000
set IMAGE_TAG=latest

REM Build and push Docker images
echo 📦 Building Docker images...
docker build -t %DOCKER_REGISTRY%/flowzen-frontend:%IMAGE_TAG% ./client
docker build -t %DOCKER_REGISTRY%/flowzen-backend:%IMAGE_TAG% ./server

echo 📤 Pushing Docker images...
docker push %DOCKER_REGISTRY%/flowzen-frontend:%IMAGE_TAG%
docker push %DOCKER_REGISTRY%/flowzen-backend:%IMAGE_TAG%

REM Deploy to production
echo 🌐 Deploying to production environment...
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Health checks
echo 🏥 Running health checks...
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    exit /b 1
)

curl -f http://localhost:5000/graphql >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    exit /b 1
)

echo 🎉 Production deployment complete!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000/graphql
