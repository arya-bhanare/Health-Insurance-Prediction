#!/bin/bash
# Build and Push to Docker Hub Script for Linux/Mac
# Usage: ./build_and_push.sh your_docker_username

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if username is provided
if [ -z "$1" ]; then
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ Docker Hub Build & Push Script             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Usage: ./build_and_push.sh YOUR_DOCKER_USERNAME"
    echo ""
    echo "Example:"
    echo "  ./build_and_push.sh aryabhanare"
    echo ""
    exit 1
fi

DOCKER_USERNAME=$1
IMAGE_NAME="health-insurance-app"
TAG="latest"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ Building Docker Image                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Build image
if docker build -t $IMAGE_NAME:$TAG .; then
    echo -e "${GREEN}✅ Image built successfully${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ Tagging Image for Docker Hub               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Tag image
docker tag $IMAGE_NAME:$TAG $DOCKER_USERNAME/$IMAGE_NAME:$TAG
echo -e "${GREEN}✅ Image tagged: $DOCKER_USERNAME/$IMAGE_NAME:$TAG${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ Pushing to Docker Hub                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Push image
if docker push $DOCKER_USERNAME/$IMAGE_NAME:$TAG; then
    echo -e "${GREEN}✅ Image pushed successfully${NC}"
else
    echo -e "${RED}❌ Push failed! Make sure you're logged in.${NC}"
    echo "Run: docker login"
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ ✅ Complete!                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Your image is now available on Docker Hub:"
echo -e "  ${YELLOW}https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME${NC}"
echo ""
echo "To pull on another computer:"
echo -e "  ${YELLOW}docker pull $DOCKER_USERNAME/$IMAGE_NAME:$TAG${NC}"
echo ""
echo "Or with docker-compose:"
echo -e "  ${YELLOW}docker-compose up -d${NC}"
echo ""
