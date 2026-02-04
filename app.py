from flask import Flask, render_template, request, jsonify, session
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np
import hashlib
import json
import pyodbc
from datetime import datetime
from functools import wraps
import os
import time

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'health-insurance-secret-key-2024'

# SQL Server Configuration - Support both local and Docker environments
SQL_SERVER_CONFIG = {
    'server': os.getenv('SQL_SERVER', 'localhost') + ',' + os.getenv('SQL_PORT', '1433'),
    'database': os.getenv('SQL_DATABASE', 'HealthInsuranceDB'),
    'username': os.getenv('SQL_USER', 'sa'),
    'password': os.getenv('SQL_PASSWORD', 'Sql@Server2025!'),
    'driver': '{ODBC Driver 18 for SQL Server}'
}

# Predefined users database
USERS_DB = {
    "admin": hashlib.sha256("admin123".encode()).hexdigest(),
    "doctor": hashlib.sha256("doctor123".encode()).hexdigest(),
    "user": hashlib.sha256("user123".encode()).hexdigest(),
}

# Global variables for data and model
df = None
model = None
le_dict = {}
db_connected = False
last_model_train_time = None

def hash_password(password):
    """Hash a password for comparison"""
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection(use_master=False):
    """Get SQL Server connection"""
    try:
        db = 'master' if use_master else SQL_SERVER_CONFIG['database']
        conn = pyodbc.connect(
            f'Driver={SQL_SERVER_CONFIG["driver"]};'
            f'Server={SQL_SERVER_CONFIG["server"]};'
            f'Database={db};'
            f'UID={SQL_SERVER_CONFIG["username"]};'
            f'PWD={SQL_SERVER_CONFIG["password"]};'
            'TrustServerCertificate=yes;'
            'Connection Timeout=5;'
        )
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"⚠️ Database connection error: {str(e)}")
        return None

def init_database():
    """Initialize database tables"""
    global db_connected
    try:
        # First, create database if it doesn't exist
        conn_master = get_db_connection(use_master=True)
        if not conn_master:
            print("⚠️ SQL Server not accessible. Using local CSV storage.")
            db_connected = False
            return False
        
        cursor = conn_master.cursor()
        # Set autocommit mode for CREATE DATABASE
        conn_master.autocommit = True
        try:
            cursor.execute(f"IF NOT EXISTS (SELECT * FROM sys.databases WHERE name='{SQL_SERVER_CONFIG['database']}') CREATE DATABASE {SQL_SERVER_CONFIG['database']}")
        except Exception as e:
            print(f"⚠️ Could not create database: {str(e)}")
        conn_master.autocommit = False
        cursor.close()
        conn_master.close()
        
        # Now connect to the created database
        conn = get_db_connection()
        if not conn:
            print("⚠️ Could not connect to created database. Using CSV storage.")
            db_connected = False
            return False
        
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='insurance_predictions' AND xtype='U')
            CREATE TABLE insurance_predictions (
                id INT IDENTITY(1,1) PRIMARY KEY,
                age INT NOT NULL,
                gender VARCHAR(10) NOT NULL,
                bmi FLOAT NOT NULL,
                bloodpressure INT NOT NULL,
                diabetic VARCHAR(10) NOT NULL,
                children INT NOT NULL,
                smoker VARCHAR(10) NOT NULL,
                region VARCHAR(20) NOT NULL,
                predicted_claim FLOAT NOT NULL,
                created_at DATETIME DEFAULT GETDATE()
            )
        ''')
        
        cursor.execute('''
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='model_metrics' AND xtype='U')
            CREATE TABLE model_metrics (
                id INT IDENTITY(1,1) PRIMARY KEY,
                train_date DATETIME DEFAULT GETDATE(),
                total_records INT,
                model_type VARCHAR(50),
                accuracy FLOAT,
                notes VARCHAR(500)
            )
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        
        db_connected = True
        print("✅ Database initialized successfully")
        return True
    except Exception as e:
        print(f"⚠️ Error initializing database: {str(e)}")
        print("💾 Will use local CSV storage for predictions")
        db_connected = False
        return False

def load_data():
    """Load insurance data from database or CSV"""
    global df, db_connected
    try:
        df_loaded = False
        
        # Try to load from database first
        if db_connected:
            try:
                conn = get_db_connection()
                if conn:
                    # Load from database
                    query = "SELECT age, gender, bmi, bloodpressure, diabetic, children, smoker, region, predicted_claim as claim FROM insurance_predictions"
                    result_df = pd.read_sql(query, conn)
                    conn.close()
                    
                    if len(result_df) > 0:
                        df = result_df
                        print(f"✅ Loaded {len(df)} records from SQL Server")
                        # Normalize categorical fields to lowercase
                        for col in ['gender', 'diabetic', 'smoker', 'region']:
                            if col in df.columns:
                                df[col] = df[col].str.lower()
                        df_loaded = True
            except Exception as e:
                print(f"⚠️ Error loading from database: {str(e)}")
        
        # If no data from database, try CSV
        if not df_loaded and os.path.exists('insurance_data.csv'):
            df = pd.read_csv('insurance_data.csv')
            # Normalize categorical fields to lowercase
            for col in ['gender', 'diabetic', 'smoker', 'region']:
                if col in df.columns:
                    df[col] = df[col].str.lower()
            print(f"✅ Loaded {len(df)} records from CSV")
            df_loaded = True
        
        # If still no data, create sample data
        if not df_loaded:
            print("📊 Creating sample dataset...")
            np.random.seed(42)
            n_samples = 1000
            df = pd.DataFrame({
                'age': np.random.randint(18, 65, n_samples),
                'gender': np.random.choice(['male', 'female'], n_samples),
                'bmi': np.random.uniform(15, 50, n_samples),
                'bloodpressure': np.random.randint(80, 180, n_samples),
                'diabetic': np.random.choice(['no', 'yes'], n_samples),
                'children': np.random.randint(0, 6, n_samples),
                'smoker': np.random.choice(['no', 'yes'], n_samples),
                'region': np.random.choice(['northeast', 'northwest', 'southeast', 'southwest'], n_samples),
                'claim': np.random.uniform(1000, 60000, n_samples)
            })
            df.to_csv('insurance_data.csv', index=False)
            print(f"✅ Created sample dataset with {len(df)} records")
        
        df = df.dropna()
        return True
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def prepare_model():
    """Prepare and train the ML model"""
    global model, le_dict, df, last_model_train_time
    
    try:
        if df is None or len(df) == 0:
            print("❌ No data available for model training")
            return False
        
        df_ml = df.copy()
        
        # Encode categorical variables
        for col in ['gender', 'diabetic', 'smoker', 'region']:
            le = LabelEncoder()
            df_ml[col] = le.fit_transform(df_ml[col])
            le_dict[col] = le
        
        # Prepare features and target
        X = df_ml[['age', 'gender', 'bmi', 'bloodpressure', 'diabetic', 'children', 'smoker', 'region']]
        y = df_ml['claim']
        
        # Train model with more trees for better accuracy with more data
        n_estimators = min(200, max(50, len(df) // 5))
        model = RandomForestRegressor(
            n_estimators=n_estimators, 
            random_state=42, 
            n_jobs=-1,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2
        )
        model.fit(X, y)
        
        last_model_train_time = datetime.now()
        
        # Calculate and store metrics
        train_score = model.score(X, y)
        print(f"✅ Model trained successfully with {len(df)} records (R² Score: {train_score:.4f})")
        
        # Store metrics in database if connected
        if db_connected:
            save_model_metrics(len(df), train_score)
        
        return True
    except Exception as e:
        print(f"Error preparing model: {str(e)}")
        return False

def save_model_metrics(total_records, accuracy):
    """Save model training metrics to database"""
    try:
        conn = get_db_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO model_metrics (total_records, model_type, accuracy, notes)
            VALUES (?, ?, ?, ?)
        ''', (total_records, 'RandomForest', accuracy, f'Trained with {total_records} records'))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error saving metrics: {str(e)}")

def save_prediction_to_db(age, gender, bmi, bp, diabetic, children, smoker, region, predicted_cost):
    """Save prediction to database"""
    if not db_connected:
        print(f"⚠️ Database not connected. Prediction will be stored locally.")
        return False
    
    try:
        conn = get_db_connection()
        if not conn:
            print("⚠️ Could not establish database connection for saving prediction")
            return False
        
        cursor = conn.cursor()
        # Insert into existing table schema with actual_claim_final as NULL since we don't have actual data
        cursor.execute('''
            INSERT INTO insurance_predictions (age, gender, bmi, bloodpressure, diabetic, children, smoker, region, actual_claim_final, predicted_claim)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
        ''', (age, gender, bmi, bp, diabetic, children, smoker, region, predicted_cost))
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Prediction saved to database (predicted_claim: ${predicted_cost:.2f})")
        return True
    except Exception as e:
        print(f"⚠️ Error saving prediction to database: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    """Handle login"""
    try:
        data = request.get_json()
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        if username in USERS_DB:
            if USERS_DB[username] == hash_password(password):
                session['username'] = username
                session['login_time'] = datetime.now().isoformat()
                
                role = 'admin' if username == 'admin' else 'doctor' if username == 'doctor' else 'user'
                
                return jsonify({
                    'success': True,
                    'username': username,
                    'role': role,
                    'login_time': datetime.now().strftime("%H:%M"),
                    'db_status': 'connected' if db_connected else 'disconnected'
                }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """Handle logout"""
    session.clear()
    return jsonify({'success': True}), 200

@app.route('/api/data/stats', methods=['GET'])
@login_required
def get_stats():
    """Get dataset statistics"""
    try:
        return jsonify({
            'total_records': len(df),
            'avg_claim': float(df['claim'].mean()),
            'max_claim': float(df['claim'].max()),
            'min_claim': float(df['claim'].min()),
            'features': len(df.columns),
            'db_connected': db_connected,
            'last_model_train': last_model_train_time.isoformat() if last_model_train_time else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/charts', methods=['GET'])
@login_required
def get_charts_data():
    """Get data for charts"""
    try:
        global df
        
        # If df is empty or None, try to reload
        if df is None or len(df) == 0:
            print("🔄 Reloading data for charts...")
            load_data()
        
        if df is None or len(df) == 0:
            print("⚠️ No data available for charts")
            return jsonify({
                'error': 'No data available',
                'age_distribution': {'labels': [], 'data': []},
                'smoker_impact': {},
                'regional_analysis': {},
                'gender_analysis': {},
                'diabetic_analysis': {},
                'bmi_claim': [],
                'total_records': 0
            }), 200
        
        # Age distribution
        age_bins = [18, 25, 35, 45, 55, 65]
        age_counts = pd.cut(df['age'], bins=age_bins).value_counts().sort_index()
        
        # Smoker statistics
        smoker_stats = df.groupby('smoker')['claim'].agg(['mean', 'count']).to_dict()
        
        # Region counts
        region_counts = df['region'].value_counts().to_dict()
        
        # BMI vs Claim data sample
        bmi_claim_data = df[['bmi', 'claim']].sample(min(100, len(df))).values.tolist()
        
        # Gender distribution
        gender_counts = df['gender'].value_counts().to_dict()
        
        # Diabetic distribution
        diabetic_counts = df['diabetic'].value_counts().to_dict()
        
        print(f"✅ Chart data generated for {len(df)} records")
        
        return jsonify({
            'age_distribution': {
                'labels': [f"{int(age_bins[i])}-{int(age_bins[i+1])}" for i in range(len(age_bins)-1)],
                'data': age_counts.values.tolist()
            },
            'smoker_impact': smoker_stats,
            'regional_analysis': region_counts,
            'gender_analysis': gender_counts,
            'diabetic_analysis': diabetic_counts,
            'bmi_claim': bmi_claim_data,
            'total_records': len(df)
        }), 200
    except Exception as e:
        print(f"⚠️ Error generating chart data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'age_distribution': {'labels': [], 'data': []},
            'smoker_impact': {},
            'regional_analysis': {},
            'gender_analysis': {},
            'diabetic_analysis': {},
            'bmi_claim': [],
            'total_records': 0
        }), 200

@app.route('/api/predict', methods=['POST'])
@login_required
def predict():
    """Make prediction"""
    try:
        data = request.get_json()
        
        age = float(data.get('age', 0))
        gender = data.get('gender', 'male')
        bmi = float(data.get('bmi', 0))
        bloodpressure = float(data.get('bloodpressure', 0))
        diabetic = data.get('diabetic', 'No')
        children = int(data.get('children', 0))
        smoker = data.get('smoker', 'No')
        region = data.get('region', 'northeast')
        
        if not all([age, gender, bmi, bloodpressure, diabetic, region]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Normalize all categorical fields to lowercase for encoding
        gender_lower = gender.lower()
        region_lower = region.lower()
        diabetic_lower = diabetic.lower()
        smoker_lower = smoker.lower()
        
        # Encode categorical features
        try:
            gender_enc = le_dict['gender'].transform([gender_lower])[0]
            diabetic_enc = le_dict['diabetic'].transform([diabetic_lower])[0]
            smoker_enc = le_dict['smoker'].transform([smoker_lower])[0]
            region_enc = le_dict['region'].transform([region_lower])[0]
        except ValueError as ve:
            return jsonify({'error': f'Invalid field value: {str(ve)}'}), 400
        
        # Make prediction
        prediction = model.predict([[age, gender_enc, bmi, bloodpressure, diabetic_enc, children, smoker_enc, region_enc]])
        predicted_cost = float(prediction[0])
        
        # Save to database
        db_saved = save_prediction_to_db(age, gender_lower, bmi, bloodpressure, diabetic_lower, children, smoker_lower, region_lower, predicted_cost)
        
        return jsonify({
            'success': True,
            'predicted_cost': predicted_cost,
            'db_saved': db_saved,
            'input_summary': {
                'age': age,
                'gender': gender_lower.title(),
                'bmi': round(bmi, 1),
                'bloodpressure': bloodpressure,
                'diabetic': diabetic_lower.title(),
                'children': children,
                'smoker': smoker_lower.title(),
                'region': region_lower.title()
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
@login_required
def get_history():
    """Get prediction history from database"""
    try:
        global db_connected
        
        # Try to connect if not already connected
        if not db_connected:
            print("🔄 Attempting to reconnect to database...")
            init_database()
        
        conn = get_db_connection()
        if not conn:
            print("⚠️ Database connection failed - returning empty history")
            return jsonify({
                'predictions': [],
                'source': 'db_error',
                'message': 'Could not connect to database',
                'db_connected': False
            }), 200
        
        try:
            # Use correct column names: prediction_date instead of created_at
            query = "SELECT TOP 100 age, gender, bmi, bloodpressure, diabetic, children, smoker, region, predicted_claim, prediction_date FROM insurance_predictions ORDER BY prediction_date DESC"
            history_df = pd.read_sql(query, conn)
            conn.close()
            
            if history_df.empty:
                print("📊 No predictions in database yet")
                return jsonify({
                    'predictions': [],
                    'source': 'database',
                    'total_in_db': 0,
                    'message': 'No predictions recorded yet',
                    'db_connected': True
                }), 200
            
            predictions = []
            for _, row in history_df.iterrows():
                try:
                    pred_dict = {
                        'age': int(row['age']),
                        'gender': str(row['gender']).lower(),
                        'bmi': float(row['bmi']),
                        'bloodpressure': int(row['bloodpressure']),
                        'diabetic': str(row['diabetic']).lower(),
                        'children': int(row['children']),
                        'smoker': str(row['smoker']).lower(),
                        'region': str(row['region']).lower(),
                        'predicted_cost': float(row['predicted_claim']),
                        'timestamp': row['prediction_date'].isoformat() if hasattr(row['prediction_date'], 'isoformat') else str(row['prediction_date'])
                    }
                    predictions.append(pred_dict)
                except Exception as e:
                    print(f"⚠️ Error parsing prediction row: {str(e)}")
                    continue
            
            print(f"✅ Retrieved {len(predictions)} predictions from database")
            return jsonify({
                'predictions': predictions,
                'source': 'database',
                'total_in_db': len(predictions),
                'db_connected': True
            }), 200
        except Exception as e:
            print(f"⚠️ Error querying predictions: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'predictions': [],
                'source': 'error',
                'error': str(e),
                'db_connected': False
            }), 200
    except Exception as e:
        print(f"❌ History retrieval error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'source': 'error',
            'predictions': [],
            'db_connected': False
        }), 200

@app.route('/api/retrain', methods=['POST'])
@login_required
def retrain_model():
    """Retrain model with latest data from database"""
    try:
        # Check if user is admin
        if session.get('username') != 'admin':
            return jsonify({'error': 'Only admins can retrain the model'}), 403
        
        # Reload data from database
        if load_data():
            if prepare_model():
                return jsonify({
                    'success': True,
                    'message': 'Model retrained successfully',
                    'total_records': len(df),
                    'last_train_time': last_model_train_time.isoformat()
                }), 200
        
        return jsonify({'error': 'Failed to retrain model'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/db/status', methods=['GET'])
@login_required
def db_status():
    """Get database connection status"""
    try:
        status_info = {
            'connected': db_connected,
            'df_loaded': df is not None and len(df) > 0 if df is not None else False,
            'df_rows': len(df) if df is not None else 0,
            'model_ready': model is not None,
            'last_train_time': last_model_train_time.isoformat() if last_model_train_time else None
        }
        
        if db_connected:
            try:
                conn = get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT COUNT(*) as count FROM insurance_predictions")
                    count = cursor.fetchone()[0]
                    cursor.close()
                    conn.close()
                    status_info['total_predictions'] = count
            except Exception as e:
                status_info['db_error'] = str(e)
        
        return jsonify(status_info), 200
    except Exception as e:
        return jsonify({'connected': False, 'error': str(e)}), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Health Insurance Prediction Portal - Starting...")
    print("="*60)
    
    # Initialize database
    print("\n📊 Initializing Database...")
    init_database()
    
    # Load data
    print("📥 Loading Data...")
    if load_data():
        # Prepare model
        print("🤖 Training Model...")
        if prepare_model():
            print("✅ All systems ready!")
        else:
            print("⚠️ Error training model")
    else:
        print("❌ Error loading data")
    
    print("\n" + "="*60)
    print("🌐 Server Information:")
    print(f"📱 Access the application at: http://localhost:5000")
    print(f"🗄️  Database Status: {'Connected ✅' if db_connected else 'Disconnected ⚠️'}")
    print(f"👤 Demo Credentials:")
    print(f"   - Admin: admin / admin123 (Can retrain model)")
    print(f"   - Doctor: doctor / doctor123")
    print(f"   - User: user / user123")
    print("="*60 + "\n")
    
    app.run(debug=False, host='localhost', port=5000)
