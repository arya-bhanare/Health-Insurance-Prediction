# 🚀 Quick Reference - Docker Hub Push

## Your Docker Information

```
Docker Username:       aryabhanare
Repository:           arya-bhanare-health-insurance-prediction
Docker Hub URL:       https://hub.docker.com/r/aryabhanare/arya-bhanare-health-insurance-prediction
Full Image Name:      aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

---

## ⚡ Fastest Way (Recommended)

### Windows Users:
```bash
push_to_dockerhub.bat
```

### Linux/Mac Users:
```bash
chmod +x push_to_dockerhub.sh
./push_to_dockerhub.sh
```

**That's it! The script handles everything (5 steps).**

---

## 📋 Manual Steps (If You Prefer)

```bash
# Step 1: Login
docker login
# Enter: aryabhanare
# Then: Your Docker Hub password

# Step 2: Build
docker build -t aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0 .

# Step 3: Tag Latest
docker tag aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0 \
  aryabhanare/arya-bhanare-health-insurance-prediction:latest

# Step 4: Push v1.0.0
docker push aryabhanare/arya-bhanare-health-insurance-prediction:v1.0.0

# Step 5: Push Latest
docker push aryabhanare/arya-bhanare-health-insurance-prediction:latest
```

---

## ✅ Verify Success

1. Wait for push to complete (5-10 minutes)
2. Visit: https://hub.docker.com/r/aryabhanare/arya-bhanare-health-insurance-prediction
3. You should see tags: **v1.0.0** and **latest**

---

## 🎯 Pull on Different Computer

### Option A: Docker Compose (Recommended)
```bash
# Clone GitHub repo
git clone https://github.com/arya-bhanare/Health-Insurance-Prediction.git
cd Health-Insurance-Prediction

# Run everything
docker-compose up -d

# Access at: http://localhost:5000
```

### Option B: Simple Docker Run
```bash
docker run -p 5000:5000 aryabhanare/arya-bhanare-health-insurance-prediction:latest

# Access at: http://localhost:5000
```

---

## 📝 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Doctor | doctor | doctor123 |
| Guest | guest | guest123 |

---

## 🐛 Common Issues & Fixes

### "Login Succeeded" doesn't appear?
```bash
# Check if already logged in
docker info

# If not, login again
docker logout
docker login
```

### Build takes too long?
- Normal! First build takes 3-5 minutes
- Subsequent builds are faster (cached layers)

### Push fails with "denied: requested access"?
```bash
# Re-login
docker logout
docker login

# Verify username is correct: aryabhanare
```

### "Connection refused" when running?
- Docker containers may need 30-60 seconds to start
- Check status: `docker ps`
- View logs: `docker logs health_insurance_app`

---

## 📚 Full Guides

- **Detailed Push Guide:** `DOCKER_HUB_PUSH_GUIDE.md`
- **Docker Setup Guide:** `DOCKER_SETUP.md`
- **Project README:** `README.md`

---

## 🔗 Important Links

- Docker Hub: https://hub.docker.com/r/aryabhanare/arya-bhanare-health-insurance-prediction
- GitHub: https://github.com/arya-bhanare/Health-Insurance-Prediction
- Docker Docs: https://docs.docker.com/

---

## ⏱️ Timeline

| Task | Time |
|------|------|
| First Build | 3-5 min |
| Tag Image | < 1 sec |
| Push v1.0.0 | 5-10 min |
| Push Latest | 5-10 min |
| **Total** | **15-25 min** |

---

**Ready? Start with `push_to_dockerhub.bat` or follow the manual steps above! 🚀**
