#!/bin/bash

# ========================================
# Docker Hub Push Script for Linux/Mac
# ========================================

set -e  # Exit on error

# Configuration
DOCKER_USERNAME="aryabhanare"
IMAGE_NAME="arya-bhanare-health-insurance-prediction"
VERSION="v1.0.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Docker Hub Push Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_info() {
    echo -e "${YELLOW}[*] $1${NC}"
}

# Main script
print_header

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    echo "Please install Docker from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

print_success "Docker found"
docker --version
echo ""

# Step 1: Build Image
print_info "Building Docker image locally..."
echo "Command: docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} ."
echo ""

if ! docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} .; then
    print_error "Build failed!"
    exit 1
fi

print_success "Build successful!"
echo ""

# Step 2: Tag as latest
print_info "Tagging image as latest..."
echo "Command: docker tag ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""

if ! docker tag ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest; then
    print_error "Tagging failed!"
    exit 1
fi

print_success "Tagging successful!"
echo ""

# Step 3: Verify images
print_info "Verifying images..."
echo ""
docker images | grep ${IMAGE_NAME} || true
echo ""

# Step 4: Login check
print_info "Checking Docker Hub login..."
echo ""

if ! docker info | grep -q "Username"; then
    print_info "Not logged in to Docker Hub"
    echo "Please enter your Docker Hub credentials:"
    echo ""
    docker login
    echo ""
fi

print_success "Docker Hub login verified!"
echo ""

# Step 5: Push to Docker Hub
print_info "Pushing image to Docker Hub..."
echo "This may take 2-5 minutes depending on image size and internet speed"
echo ""

echo "Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}..."
if ! docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}; then
    print_error "Push v1.0.0 failed!"
    exit 1
fi

print_success "Pushed ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""

echo "Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:latest..."
if ! docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest; then
    print_error "Push latest failed!"
    exit 1
fi

print_success "Pushed ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""

# Success message
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Your image is now on Docker Hub!"
echo ""
echo "Image Details:"
echo "  Username:      ${DOCKER_USERNAME}"
echo "  Repository:    ${IMAGE_NAME}"
echo "  Tags:          ${VERSION}, latest"
echo ""
echo "Docker Hub URL:"
echo -e "  ${BLUE}https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}${NC}"
echo ""
echo "Pull commands:"
echo "  docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "  docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "Run with Docker Compose:"
echo "  docker-compose up -d"
echo ""
echo "Run standalone:"
echo "  docker run -p 5000:5000 ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "Access application at: http://localhost:5000"
echo ""
