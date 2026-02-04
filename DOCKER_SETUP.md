# 🐳 Docker Hub Setup Guide

Complete guide to build, push to Docker Hub, and run on any computer.

---

## 📋 Prerequisites

- Docker installed on your machine
- Docker Hub account (free at https://hub.docker.com)
- Git (optional, for version control)

---

## 🔧 Step 1: Build Docker Image Locally

### Option A: Build for Local Testing

```bash
# Navigate to project directory
cd Health-Insurance-Predection-main

# Build the image
docker build -t health-insurance-app:latest .

# Verify the image was created
docker images
```

### Option B: Build with Docker Compose (Recommended)

```bash
# Start both SQL Server and Flask app
docker-compose up -d

# Check containers are running
docker ps

# View logs
docker logs health_insurance_app
docker logs health_insurance_db
```

---

## 🔐 Step 2: Login to Docker Hub

```bash
# Login to Docker Hub (enter your credentials)
docker login

# Username: your_docker_username
# Password: your_docker_password
```

---

## 📤 Step 3: Tag Image for Docker Hub

Replace `your_docker_username` with your actual Docker Hub username:

```bash
# Tag the image
docker tag health-insurance-app:latest your_docker_username/health-insurance-app:latest

# Optional: Add version tag
docker tag health-insurance-app:latest your_docker_username/health-insurance-app:v1.0
```

---

## 🚀 Step 4: Push to Docker Hub

```bash
# Push the image to Docker Hub
docker push your_docker_username/health-insurance-app:latest

# Optional: Push with version tag
docker push your_docker_username/health-insurance-app:v1.0

# Verify on Docker Hub
# Visit: https://hub.docker.com/r/your_docker_username/health-insurance-app
```

---

## 💻 Step 5: Run on Different Computer

### On the New Computer:

#### Option A: Using Docker Compose (Easiest)

```bash
# Create project directory
mkdir health-insurance
cd health-insurance

# Copy docker-compose.yml to this directory
# (You can get it from your GitHub repo)

# Start all containers
docker-compose up -d

# Check containers
docker ps

# View logs
docker-compose logs -f app
```

#### Option B: Using Only Flask Container

```bash
# Pull the image from Docker Hub
docker pull your_docker_username/health-insurance-app:latest

# Run just the app container (requires SQL Server running separately)
docker run -d \
  -p 5000:5000 \
  -e SQL_SERVER=your_sql_server_ip \
  -e SQL_PORT=1433 \
  -e SQL_USER=sa \
  -e SQL_PASSWORD=your_password \
  -e SQL_DATABASE=HealthInsuranceDB \
  --name health_app \
  your_docker_username/health-insurance-app:latest

# Access the app
# Browser: http://localhost:5000
```

#### Option C: Complete Multi-Container Setup

```bash
# Clone your repository or copy files
# Make sure docker-compose.yml is present

# Pull and run everything
docker-compose -f docker-compose.yml up -d

# Wait for containers to start (usually 30-60 seconds)
docker-compose logs -f

# Access the app
# Browser: http://localhost:5000
```

---

## 🔍 Troubleshooting

### Container won't start?

```bash
# Check logs
docker logs health_insurance_app

# Stop and remove containers
docker-compose down

# Remove images
docker rmi your_docker_username/health-insurance-app:latest

# Rebuild
docker-compose up -d
```

### Database connection error?

```bash
# Verify SQL Server container is running
docker ps

# Check SQL Server logs
docker logs health_insurance_db

# Restart containers
docker-compose restart
```

### Port already in use?

```bash
# Change ports in docker-compose.yml
# Or kill the process using the port

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>
```

### Can't connect to Docker Hub?

```bash
# Check Docker login
docker info

# Login again
docker logout
docker login

# Use your authentication token instead of password
# (Recommended for security)
```

---

## 📊 Environment Variables

When running the container, you can customize:

```bash
docker run -d \
  -p 5000:5000 \
  -e SQL_SERVER=mssql \
  -e SQL_PORT=1433 \
  -e SQL_USER=sa \
  -e SQL_PASSWORD=Sql@Server2025! \
  -e SQL_DATABASE=HealthInsuranceDB \
  -e FLASK_ENV=production \
  --name app \
  your_docker_username/health-insurance-app:latest
```

---

## 🛑 Stop and Remove Containers

```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove all stopped containers
docker container prune

# Remove all dangling images
docker image prune
```

---

## 📝 Example Docker Hub Commands

```bash
# List your images
docker images

# Search Docker Hub
docker search health-insurance

# Inspect image
docker inspect your_docker_username/health-insurance-app:latest

# View image layers
docker history your_docker_username/health-insurance-app:latest

# Remove image locally
docker rmi your_docker_username/health-insurance-app:latest
```

---

## 🔐 Security Best Practices

1. **Never commit passwords to Git**
   - Use environment variables
   - Use `.env` file (add to `.gitignore`)

2. **Use strong SQL password**
   - Current: `Sql@Server2025!`
   - Change in production

3. **Limit port exposure**
   - Don't expose 1433 to internet in production
   - Use firewall rules

4. **Use private Docker repositories**
   - Docker Hub Pro accounts available
   - Keep sensitive code private

---

## 📦 Docker Compose Common Commands

```bash
# Start services in background
docker-compose up -d

# View running services
docker-compose ps

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f

# Stop all services
docker-compose stop

# Restart services
docker-compose restart

# Pull latest images
docker-compose pull

# Rebuild images
docker-compose build

# Validate compose file
docker-compose config
```

---

## 📞 Support & Resources

- Docker Docs: https://docs.docker.com
- Docker Hub: https://hub.docker.com
- Docker Compose: https://docs.docker.com/compose
- SQL Server in Docker: https://hub.docker.com/_/microsoft-mssql-server

---

## ✅ Deployment Checklist

- [ ] Docker installed on all computers
- [ ] Docker Hub account created
- [ ] Image built successfully
- [ ] Image tagged correctly
- [ ] Image pushed to Docker Hub
- [ ] docker-compose.yml configured
- [ ] Environment variables set
- [ ] Ports available (5000, 1433)
- [ ] SQL Server container starts
- [ ] Flask app container starts
- [ ] Application accessible at http://localhost:5000
- [ ] Database connection successful

---

**Ready to deploy! 🚀**
