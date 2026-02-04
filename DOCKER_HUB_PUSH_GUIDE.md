# 🐳 Docker Hub Push & Deployment Guide

## Complete Step-by-Step Instructions

### ✅ Prerequisites

- ✓ Docker installed (v29.1.5 or later)
- ✓ Docker Hub account created at https://hub.docker.com
- ✓ Docker Hub username: `aryabhanare`
- ✓ All project files in place

---

## 📋 Complete Deployment Workflow

### **STEP 1: Login to Docker Hub**

```bash
docker login
```

**Output will prompt:**
```
Login with your Docker ID to push and pull images from Docker Hub. 
If you don't have a Docker ID, head over to https://hub.docker.com to create one.

Username: aryabhanare
Password: (enter your Docker Hub password)
```

**Expected Result:**
```
Login Succeeded
```

**Verify Login:**
```bash
docker info
```

You should see your username in the output.

---

### **STEP 2: Build the Docker Image Locally**

```bash
docker build -t aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0 .
```

**Parameters:**
- `-t` = Tag the image
- `aryabhanare` = Your Docker Hub username
- `arya-bhanare-health-insurance-prediction` = Repository name
- `v1.0.0` = Version tag
- `.` = Build from current directory (where Dockerfile is)

**Output will show:**
```
[1/8] FROM python:3.11-slim
[2/8] WORKDIR /app
...
Successfully built abc123xyz
Successfully tagged aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0
```

**Verify Image Built:**
```bash
docker images | grep health-insurance
```

---

### **STEP 3: Tag Image with Latest Version**

```bash
docker tag aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0 aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

**Verify Tags:**
```bash
docker images | grep health-insurance
```

**Expected Output:**
```
REPOSITORY                                          TAG      IMAGE ID
aryabhanare/arya-bhanare-health-insurance-prediction  v1.0.0   abc123xyz
aryabhanare/arya-bhanare-health-insurance-prediction  latest   abc123xyz
```

---

### **STEP 4: Push to Docker Hub**

**Push v1.0.0 tag:**
```bash
docker push aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0
```

**Push latest tag:**
```bash
docker push aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

**Output will show progress:**
```
The push refers to repository [docker.io/aryabhanare/arya-bhanare-health-insurance-prediction]
v1.0.0: Pushing [=======>            ] 45.21MB/123MB
latest: Pushing complete
```

**Wait for completion** (may take 2-5 minutes depending on internet speed)

---

### **STEP 5: Verify Image on Docker Hub**

Visit: https://hub.docker.com/r/aryabhanare/arya-bhanare-health-insurance-prediction

**You should see:**
- ✅ Repository name
- ✅ Image size (~800MB)
- ✅ Tags: v1.0.0, latest
- ✅ Pull count
- ✅ Last pushed date

---

## 🚀 Deploy on Different Computer

### **Option 1: Using Docker Compose (Easiest)**

**Step 1: Download docker-compose.yml**
```bash
# Create project directory
mkdir health-insurance
cd health-insurance

# Download the docker-compose.yml file
# (Copy from your GitHub repository or project)
```

**Step 2: Pull and Run**
```bash
docker-compose up -d
```

**This will:**
- ✅ Pull the image from Docker Hub
- ✅ Start SQL Server container
- ✅ Start Flask app container
- ✅ Create network and volumes

**Verify:**
```bash
docker ps
```

**Access Application:**
```
http://localhost:5000
```

---

### **Option 2: Run Single Container**

**Pull Image:**
```bash
docker pull aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

**Run Container:**
```bash
docker run -p 5000:5000 \
  -e SQL_SERVER=localhost \
  -e SQL_PORT=1433 \
  -e SQL_USER=sa \
  -e SQL_PASSWORD=Sql@Server2025! \
  -e SQL_DATABASE=HealthInsuranceDB \
  aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

**Access Application:**
```
http://localhost:5000
```

---

### **Option 3: Run Full Multi-Container Setup**

**Step 1: Create docker-compose.yml**
```yaml
version: '3.8'

services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: health_insurance_db
    ports:
      - "1433:1433"
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "Sql@Server2025!"
      MSSQL_PID: "Developer"
    volumes:
      - mssql_data:/var/opt/mssql
    healthcheck:
      test: ["CMD", "sqlcmd", "-S", "localhost", "-U", "sa", "-P", "Sql@Server2025!", "-Q", "SELECT 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped
    networks:
      - health_network

  app:
    image: aryabhanare/arya-bhanare-health-insurance-prediction:latest
    container_name: health_insurance_app
    ports:
      - "5000:5000"
    environment:
      SQL_SERVER: mssql
      SQL_PORT: 1433
      SQL_USER: sa
      SQL_PASSWORD: Sql@Server2025!
      SQL_DATABASE: HealthInsuranceDB
    depends_on:
      mssql:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - health_network

networks:
  health_network:
    driver: bridge

volumes:
  mssql_data:
    driver: local
```

**Step 2: Run Full Stack**
```bash
docker-compose up -d
```

---

## 🔍 Useful Docker Commands

**View Running Containers:**
```bash
docker ps
```

**View All Images:**
```bash
docker images | grep health-insurance
```

**View Container Logs:**
```bash
docker logs health_insurance_app
```

**View Real-time Logs:**
```bash
docker logs -f health_insurance_app
```

**Stop Containers:**
```bash
docker-compose down
```

**Remove Image:**
```bash
docker rmi aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0
```

**Pull Latest Image:**
```bash
docker pull aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

---

## 📊 Complete Push Command Reference

### Standard Push Commands:

```bash
# Step 1: Build
docker build -t aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0 .

# Step 2: Tag Latest
docker tag aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0 aryabhanare/arya-bhanare-health-insurance-prediction:latest

# Step 3: Login (if not already logged in)
docker login

# Step 4: Push v1.0.0
docker push aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0

# Step 5: Push Latest
docker push aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

---

## ✅ Complete Deployment Checklist

- [ ] Docker installed and verified
- [ ] Docker Hub account created (aryabhanare)
- [ ] Logged in with `docker login`
- [ ] Image built locally with `docker build`
- [ ] Image tagged with version number
- [ ] Image tagged as `latest`
- [ ] Both tags pushed to Docker Hub
- [ ] Verified on Docker Hub website
- [ ] Tested pull from Docker Hub on another computer
- [ ] `docker-compose up -d` runs successfully
- [ ] Application accessible at http://localhost:5000
- [ ] Demo credentials work (admin/admin123)

---

## 🐛 Troubleshooting

### **"docker: command not found"**
- Solution: Install Docker from https://www.docker.com/products/docker-desktop

### **"denied: requested access to the resource is denied"**
- Solution: Run `docker login` and verify credentials

### **"failed to solve with frontend dockerfile.v0"**
- Solution: Ensure Dockerfile exists in current directory: `ls Dockerfile`

### **"Connection refused when running container"**
- Solution: 
  - Ensure SQL Server container is running: `docker ps`
  - Wait 30-60 seconds for SQL Server to initialize
  - Check logs: `docker logs health_insurance_db`

### **"Port already in use"**
- Solution: Change port mapping in docker-compose.yml:
  ```yaml
  ports:
    - "5001:5000"  # Changed from 5000 to 5001
  ```

### **"Image won't pull from Docker Hub"**
- Solution:
  - Check internet connection
  - Verify repository exists: https://hub.docker.com/r/aryabhanare/arya-bhanare-health-insurance-prediction
  - Try: `docker pull aryabhanare/arya-bhanare-health-insurance-prediction:latest`

---

## 📞 Quick Reference

**Your Docker Hub Details:**
- Username: `aryabhanare`
- Repository: `arya-bhanare-health-insurance-prediction`
- Full Image: `aryabhanare/arya-bhanare-health-insurance-prediction:latest`
- Docker Hub URL: https://hub.docker.com/r/aryabhanare/arya-bhanare-health-insurance-prediction

**Application Access:**
- Local: http://localhost:5000
- Demo Admin: admin / admin123
- Demo Doctor: doctor / doctor123
- Demo Guest: guest / guest123

**Database:**
- Server: localhost:1433 (local) or mssql:1433 (Docker)
- Username: sa
- Password: Sql@Server2025!
- Database: HealthInsuranceDB

---

## 🎉 Success Indicators

✅ **You'll know it's working when:**
1. `docker login` completes without error
2. `docker build` shows "Successfully tagged"
3. `docker push` shows "Pushed successfully"
4. Image appears on Docker Hub website
5. `docker pull` retrieves your image from Docker Hub
6. `docker-compose up -d` starts without errors
7. Browser shows Flask login page at http://localhost:5000

---

**Your application is now deployed to Docker Hub! 🚀**

Anyone can now pull and run it with:
```bash
docker pull aryabhanare/arya-bhanare-health-insurance-prediction:latest
docker run -p 5000:5000 aryabhanare/arya-bhanare-health-insurance-prediction:latest
```
