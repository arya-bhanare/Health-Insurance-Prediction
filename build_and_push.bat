@echo off
REM Build and Push to Docker Hub Script for Windows
REM Usage: build_and_push.bat your_docker_username

setlocal enabledelayedexpansion

REM Check if username is provided
if "%1"=="" (
    echo.
    echo ╔════════════════════════════════════════════╗
    echo ║ Docker Hub Build & Push Script             ║
    echo ╚════════════════════════════════════════════╝
    echo.
    echo Usage: build_and_push.bat YOUR_DOCKER_USERNAME
    echo.
    echo Example:
    echo   build_and_push.bat aryabhanare
    echo.
    exit /b 1
)

set DOCKER_USERNAME=%1
set IMAGE_NAME=health-insurance-app
set TAG=latest

echo.
echo ╔════════════════════════════════════════════╗
echo ║ Building Docker Image                      ║
echo ╚════════════════════════════════════════════╝
echo.

REM Build image
docker build -t %IMAGE_NAME%:%TAG% .
if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)
echo ✅ Image built successfully

echo.
echo ╔════════════════════════════════════════════╗
echo ║ Tagging Image for Docker Hub               ║
echo ╚════════════════════════════════════════════╝
echo.

REM Tag image
docker tag %IMAGE_NAME%:%TAG% %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo ✅ Image tagged: %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%

echo.
echo ╔════════════════════════════════════════════╗
echo ║ Pushing to Docker Hub                      ║
echo ╚════════════════════════════════════════════╝
echo.

REM Push image
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
if errorlevel 1 (
    echo ❌ Push failed! Make sure you're logged in.
    echo Run: docker login
    exit /b 1
)
echo ✅ Image pushed successfully

echo.
echo ╔════════════════════════════════════════════╗
echo ║ ✅ Complete!                               ║
echo ╚════════════════════════════════════════════╝
echo.
echo Your image is now available on Docker Hub:
echo   https://hub.docker.com/r/%DOCKER_USERNAME%/%IMAGE_NAME%
echo.
echo To pull on another computer:
echo   docker pull %DOCKER_USERNAME%/%IMAGE_NAME%:%TAG%
echo.
echo Or with docker-compose:
echo   docker-compose up -d
echo.
