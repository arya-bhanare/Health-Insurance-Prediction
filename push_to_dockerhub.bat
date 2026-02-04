@echo off
REM ========================================
REM Docker Hub Push Script for Windows
REM ========================================

setlocal enabledelayedexpansion

REM Configuration
set DOCKER_USERNAME=aryabhanare
set IMAGE_NAME=arya-bhanare-health-insurance-prediction
set VERSION=v1.0.0

REM Colors for output
for /F %%A in ('echo prompt $H ^| cmd') do set "BS=%%A"

echo.
echo ========================================
echo   Docker Hub Push Script
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [✓] Docker found: 
docker --version
echo.

REM Step 1: Build Image
echo [1/5] Building Docker image locally...
echo Command: docker build -t %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION% .
echo.

docker build -t %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION% .

if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [✓] Build successful!
echo.

REM Step 2: Tag as latest
echo [2/5] Tagging image as latest...
echo Command: docker tag %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION% %DOCKER_USERNAME%/%IMAGE_NAME%:latest
echo.

docker tag %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION% %DOCKER_USERNAME%/%IMAGE_NAME%:latest

if errorlevel 1 (
    echo [ERROR] Tagging failed!
    pause
    exit /b 1
)

echo [✓] Tagging successful!
echo.

REM Step 3: Verify images
echo [3/5] Verifying images...
echo.
docker images | findstr "%IMAGE_NAME%"
echo.

REM Step 4: Login check
echo [4/5] Checking Docker Hub login...
echo.
docker info | findstr "Username" >nul 2>&1

if errorlevel 1 (
    echo [!] Not logged in to Docker Hub
    echo Please run: docker login
    echo Then enter your Docker Hub credentials
    echo.
    docker login
    
    if errorlevel 1 (
        echo [ERROR] Login failed!
        pause
        exit /b 1
    )
)

echo [✓] Docker Hub login verified!
echo.

REM Step 5: Push to Docker Hub
echo [5/5] Pushing image to Docker Hub...
echo This may take 2-5 minutes depending on image size and internet speed
echo.

echo Pushing %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%...
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%

if errorlevel 1 (
    echo [ERROR] Push v1.0.0 failed!
    pause
    exit /b 1
)

echo [✓] Pushed %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%
echo.

echo Pushing %DOCKER_USERNAME%/%IMAGE_NAME%:latest...
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:latest

if errorlevel 1 (
    echo [ERROR] Push latest failed!
    pause
    exit /b 1
)

echo [✓] Pushed %DOCKER_USERNAME%/%IMAGE_NAME%:latest
echo.

REM Success message
echo ========================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Your image is now on Docker Hub!
echo.
echo Image Details:
echo   Username:      %DOCKER_USERNAME%
echo   Repository:    %IMAGE_NAME%
echo   Tags:          %VERSION%, latest
echo.
echo Docker Hub URL:
echo   https://hub.docker.com/r/%DOCKER_USERNAME%/%IMAGE_NAME%
echo.
echo Pull commands:
echo   docker pull %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%
echo   docker pull %DOCKER_USERNAME%/%IMAGE_NAME%:latest
echo.
echo Run with Docker Compose:
echo   docker-compose up -d
echo.
echo Run standalone:
echo   docker run -p 5000:5000 %DOCKER_USERNAME%/%IMAGE_NAME%:latest
echo.
echo Access application at: http://localhost:5000
echo.
pause
