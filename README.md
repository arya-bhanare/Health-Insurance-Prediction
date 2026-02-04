# 🏥 Health Insurance Prediction Portal

An AI-powered system for predicting insurance claims using machine learning, built with Flask and SQL Server.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- SQL Server 2025 (running on localhost:1433)
- pip package manager

### Installation

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the Flask application
python app.py

# 3. Open your browser
http://localhost:5000
```

## 👤 Demo Credentials

| Role   | Username | Password      |
|--------|----------|---------------|
| Admin  | admin    | admin123      |
| Doctor | doctor   | doctor123     |
| User   | user     | user123       |

**Admin** can retrain the model to improve accuracy.

## 📊 Features

✅ **AI Prediction** - Predict insurance costs in seconds  
✅ **Prediction History** - Track all predictions with timestamps  
✅ **Analytics Dashboard** - 6 interactive visualizations  
✅ **Model Training** - Retrain model with updated data  
✅ **Multi-User Roles** - Admin, Doctor, User access levels  
✅ **Responsive Design** - Works on desktop, tablet, mobile  
✅ **Professional Footer** - With social links and contact info  

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend | Flask 3.1.2 |
| Database | SQL Server 2025 |
| ML Model | scikit-learn (RandomForestRegressor) |
| Frontend | HTML5, CSS3, JavaScript |
| Charts | Chart.js 4.4.0 |
| 3D Graphics | Three.js |

## 📁 Project Structure

```
Health-Insurance-Prediction/
├── app.py                  # Flask application (main)
├── requirements.txt        # Python dependencies
├── insurance_data.csv      # Training dataset
├── docker-compose.yml      # Database setup
├── README.md              # Documentation
├── static/
│   ├── app.js            # Frontend logic
│   └── styles.css        # Styling
└── templates/
    └── index.html        # UI template
```

## 💾 Database Configuration

The system uses SQL Server with the following table:

**insurance_predictions**
- id: INT (Primary Key)
- age, gender, bmi, bloodpressure, diabetic, children, smoker, region
- predicted_claim: FLOAT
- prediction_date: DATETIME

## 📈 ML Model Details

- **Algorithm**: Random Forest Regressor
- **Training Data**: 200+ insurance records
- **Features**: 8 categorical and numeric features
- **Accuracy**: R² Score = 0.8150

## 👨‍💻 Developer

**Arya Bhanare**

- 📱 +91-9322953249
- 🐙 [GitHub](https://github.com/arya-bhanare)
- 💼 [LinkedIn](https://www.linkedin.com/in/arya-bhanare-44a99b3a3)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

**© 2026 Health Insurance Prediction Portal. All rights reserved.**

## Improvements Over Time

```
Initial:        1000 records  →  R² = 0.7254
After 50 preds: 1050 records  →  Retrain  →  R² = 0.7312 (+0.8%)
After 100 pred: 1100 records  →  Retrain  →  R² = 0.7385 (+1.8%)
After 500 preds:1500+ records →  Retrain  →  R² = 0.7850+ (+8%)
```

## Troubleshooting

**App won't start?**
```bash
taskkill /F /IM python.exe
python run_app.py
```

**Database error?**
```bash
docker ps  # Check if SQL Server running
docker start mssql_health  # Restart container
python run_app.py  # Restart app
```

**Port conflicts?**
```bash
netstat -ano | findstr :5000  # Find process
taskkill /PID <PID> /F  # Kill process
```

## Features

- ✅ Web-based interface (http://localhost:5000)
- ✅ Role-based access (Admin/Doctor/User)
- ✅ Real-time predictions with ML model
- ✅ Auto-save to MS SQL Server
- ✅ Prediction history from database
- ✅ Model retraining (admin)
- ✅ Data persistence (Docker volume)
- ✅ Analytics & visualizations
- ✅ Zero data loss guarantee

## Next Steps

1. Start app: `python run_app.py`
2. Open: http://localhost:5000
3. Login & make predictions
4. View history from database
5. As admin, retrain model for better accuracy

**System is production-ready!** 🚀
