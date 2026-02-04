# 🚀 Getting Started - Health Insurance Prediction Portal

## Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Application
```bash
python app.py
```

You'll see:
```
✅ Database initialized successfully
✅ Loaded 201 records from SQL Server
✅ Model trained successfully (R² Score: 0.8150)
✅ All systems ready!

📱 Access the application at: http://localhost:5000
🗄️ Database Status: Connected ✅
```

### Step 3: Open Browser
```
http://localhost:5000
```

---

## 👤 Login

Click any demo button to auto-fill credentials:

| Role | Username | Password |
|------|----------|----------|
| 👑 Admin | admin | admin123 |
| 🏥 Doctor | doctor | doctor123 |
| 👤 User | user | user123 |

**Admin** can retrain the model for better accuracy.

---

## 📊 Using the App

### 1. Make a Prediction
- Go to **"Prediction"** tab
- Fill patient details (Age, BMI, etc.)
- Click **"Get AI Prediction"**
- ✅ Auto-saved to database

### 2. View History
- Go to **"History"** tab
- See all predictions with timestamps
- Data pulled from SQL Server database

### 3. Analytics Dashboard
- Go to **"Analytics"** tab
- 6 interactive visualizations:
  - Age distribution
  - Smoker status
  - Gender distribution
  - Diabetic status
  - Regional analysis
  - BMI patterns

### 4. Retrain Model (Admin)
- Click **"Retrain Model"** button
- Model improves with new data
- R² score increases automatically

---

## ⚙️ Troubleshooting

### App won't start?
```bash
# Kill existing Python process
taskkill /F /IM python.exe

# Restart
python app.py
```

### Database connection error?
- Verify SQL Server is running on **localhost:1433**
- Check username: **sa**
- Check database: **HealthInsuranceDB**

### Predictions not saving?
- Check database connection status in startup logs
- Ensure table **insurance_predictions** exists
- Check app.py logs for error details

---

## 📞 Contact Developer

**Arya Bhanare**
- 📱 **Phone**: +91-9322953249
- 🐙 **GitHub**: https://github.com/arya-bhanare
- 💼 **LinkedIn**: https://www.linkedin.com/in/arya-bhanare-44a99b3a3

---

**Happy predicting! 🏥**
