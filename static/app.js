/* ============================================ */
/* GLOBAL VARIABLES */
/* ============================================ */

let currentUser = null;
let chartsInstances = {};

/* ============================================ */
/* INITIALIZATION */
/* ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize 3D background
    init3DBackground();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkAuthStatus();
});

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Prediction form
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.addEventListener('submit', handlePrediction);
    }
    
    // Retrain button (if admin)
    const retrainBtn = document.getElementById('retrainBtn');
    if (retrainBtn) {
        retrainBtn.addEventListener('click', handleRetrain);
    }
}

function checkAuthStatus() {
    // Check if user info is stored in sessionStorage
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
        currentUser = JSON.parse(userInfo);
        showDashboard();
    }
}

/* ============================================ */
/* AUTHENTICATION */
/* ============================================ */

function fillCredentials(username, password) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const currentType = passwordInput.type;
    passwordInput.type = currentType === 'password' ? 'text' : 'password';
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (!username || !password) {
        showError(errorDiv, 'Please enter both username and password');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user info
            const userInfo = {
                username: data.username,
                role: data.role,
                login_time: data.login_time
            };
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
            currentUser = userInfo;

            // Clear form
            document.getElementById('loginForm').reset();
            errorDiv.classList.remove('show');

            // Show dashboard
            showDashboard();
        } else {
            showError(errorDiv, data.error || 'Invalid credentials');
        }
    } catch (error) {
        showError(errorDiv, 'Connection error. Please try again.');
        console.error('Login error:', error);
    }
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function logout() {
    fetch('/api/logout', {
        method: 'POST'
    }).then(() => {
        // Clear session
        sessionStorage.removeItem('userInfo');
        currentUser = null;

        // Show login page
        showLoginPage();
    }).catch(error => {
        console.error('Logout error:', error);
        sessionStorage.removeItem('userInfo');
        currentUser = null;
        showLoginPage();
    });
}

/* ============================================ */
/* PAGE NAVIGATION */
/* ============================================ */

function showLoginPage() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('dashboardPage').classList.remove('active');
    document.body.style.overflow = 'hidden';
}

function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    document.body.style.overflow = 'auto';

    // Update user info in navbar
    updateUserInfo();

    // Load initial data
    loadStats();
    loadHistory();

    // Switch to predict tab by default
    switchTab('predict');
}

function updateUserInfo() {
    if (currentUser) {
        const initials = currentUser.username.substring(0, 2).toUpperCase();
        document.getElementById('userInitials').textContent = initials;
        document.getElementById('userName').textContent = currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1);
        
        const roleText = currentUser.role === 'admin' ? 'Administrator' : 
                        currentUser.role === 'doctor' ? 'Doctor' : 'Patient';
        document.getElementById('userRole').textContent = roleText;
        document.getElementById('loginTime').textContent = currentUser.login_time;
        
        // Show retrain button only for admin
        const retrainBtn = document.getElementById('retrainBtn');
        if (retrainBtn) {
            retrainBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        }
    }
}

function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update content tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    const tabElement = document.getElementById(tabName + 'Tab');
    if (tabElement) {
        tabElement.classList.add('active');
    }

    // Load tab-specific data
    if (tabName === 'analytics') {
        loadChartsData();
    } else if (tabName === 'history') {
        loadHistory();
    }
}

/* ============================================ */
/* DATA LOADING */
/* ============================================ */

async function loadStats() {
    try {
        const response = await fetch('/api/data/stats');
        if (response.ok) {
            const data = await response.json();
            
            document.getElementById('statRecords').textContent = data.total_records.toLocaleString();
            document.getElementById('statAvgClaim').textContent = '₹' + Math.round(data.avg_claim).toLocaleString();
            document.getElementById('statMaxClaim').textContent = '₹' + Math.round(data.max_claim).toLocaleString();
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadChartsData() {
    console.log('Loading charts data...');
    
    try {
        const response = await fetch('/api/data/charts');
        console.log('Charts response status:', response.status);
        
        const data = await response.json();
        console.log('Chart data received:', data);
        
        // Check if we have any data
        if (!data || data.total_records === 0) {
            console.warn('No chart data available:', data);
            document.querySelectorAll('.chart-container').forEach(container => {
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
                }
            });
            return;
        }
        
        // Destroy existing charts if they exist
        Object.values(chartsInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (e) {
                    console.warn('Error destroying chart:', e);
                }
            }
        });
        chartsInstances = {};
        
        // Draw all charts with error handling
        try {
            if (data.age_distribution && data.age_distribution.labels && data.age_distribution.labels.length > 0) {
                console.log('Drawing age chart...');
                drawAgeChart(data.age_distribution);
            }
        } catch (e) { console.error('Age chart error:', e); }
        
        try {
            if (data.smoker_impact && Object.keys(data.smoker_impact).length > 0) {
                console.log('Drawing smoker chart...');
                drawSmokerChart(data.smoker_impact);
            }
        } catch (e) { console.error('Smoker chart error:', e); }
        
        try {
            if (data.gender_analysis && Object.keys(data.gender_analysis).length > 0) {
                console.log('Drawing gender chart...');
                drawGenderChart(data.gender_analysis);
            }
        } catch (e) { console.error('Gender chart error:', e); }
        
        try {
            if (data.diabetic_analysis && Object.keys(data.diabetic_analysis).length > 0) {
                console.log('Drawing diabetic chart...');
                drawDiabeticChart(data.diabetic_analysis);
            }
        } catch (e) { console.error('Diabetic chart error:', e); }
        
        try {
            if (data.regional_analysis && Object.keys(data.regional_analysis).length > 0) {
                console.log('Drawing regional chart...');
                drawRegionalChart(data.regional_analysis);
            }
        } catch (e) { console.error('Regional chart error:', e); }
        
        try {
            if (data.bmi_claim && data.bmi_claim.length > 0) {
                console.log('Drawing BMI chart...');
                drawBMIChart(data.bmi_claim);
            }
        } catch (e) { console.error('BMI chart error:', e); }
        
        console.log('Chart loading completed');
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

async function loadHistory() {
    console.log('🔄 Loading history...');
    try {
        const response = await fetch('/api/history');
        console.log('History response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('History data received:', data);
            console.log('Number of predictions:', data.predictions ? data.predictions.length : 0);
            console.log('DB Connected:', data.db_connected);
            
            if (data.predictions && data.predictions.length > 0) {
                console.log('✅ Displaying', data.predictions.length, 'predictions');
                displayHistory(data.predictions);
            } else {
                console.warn('No predictions in response');
                displayHistory([]);
            }
        } else {
            console.error('Error response from history API:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('Error details:', errorData);
            displayHistory([]);
        }
    } catch (error) {
        console.error('Error loading history:', error);
        displayHistory([]);
    }
}

/* ============================================ */
/* CHARTS */
/* ============================================ */

function drawAgeChart(data) {
    const ctx = document.getElementById('ageChart');
    if (!ctx) {
        console.warn('Age chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (chartsInstances.ageChart) {
        chartsInstances.ageChart.destroy();
    }

    chartsInstances.ageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Count',
                data: data.data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(79, 172, 254, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(240, 147, 251, 1)',
                    'rgba(245, 87, 108, 1)',
                    'rgba(79, 172, 254, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.7)' }
                }
            }
        }
    });
}

function drawSmokerChart(data) {
    const ctx = document.getElementById('smokerChart');
    if (!ctx) {
        console.warn('Smoker chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (chartsInstances.smokerChart) {
        chartsInstances.smokerChart.destroy();
    }

    const labels = Object.keys(data.mean);
    const avgCosts = Object.values(data.mean).map(v => v.toFixed(0));

    chartsInstances.smokerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Cost (₹)',
                data: avgCosts,
                backgroundColor: [
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(240, 147, 251, 0.8)'
                ],
                borderColor: [
                    'rgba(67, 233, 123, 1)',
                    'rgba(240, 147, 251, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.7)' }
                }
            }
        }
    });
}

function drawRegionalChart(data) {
    const ctx = document.getElementById('regionChart');
    if (!ctx) {
        console.warn('Regional chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (chartsInstances.regionChart) {
        chartsInstances.regionChart.destroy();
    }

    chartsInstances.regionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(79, 172, 254, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(240, 147, 251, 1)',
                    'rgba(79, 172, 254, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255,255,255,0.8)' }
                }
            }
        }
    });
}

function drawBMIChart(data) {
    const ctx = document.getElementById('bmiChart');
    if (!ctx) {
        console.warn('BMI chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (chartsInstances.bmiChart) {
        chartsInstances.bmiChart.destroy();
    }

    const bmiValues = data.map(d => d[0]);
    const claimValues = data.map(d => d[1]);

    chartsInstances.bmiChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'BMI vs Claim',
                data: data.map((d, i) => ({ x: d[0], y: d[1] })),
                backgroundColor: 'rgba(77, 208, 225, 0.6)',
                borderColor: 'rgba(77, 208, 225, 1)',
                borderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Claim (₹)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.7)' }
                },
                x: {
                    title: { display: true, text: 'BMI' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.7)' }
                }
            }
        }
    });
}

function drawGenderChart(data) {
    const ctx = document.getElementById('genderChart');
    if (!ctx) {
        console.warn('Gender chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (chartsInstances.genderChart) {
        chartsInstances.genderChart.destroy();
    }

    const labels = Object.keys(data).map(k => k.charAt(0).toUpperCase() + k.slice(1));
    const values = Object.values(data);

    chartsInstances.genderChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(240, 147, 251, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(240, 147, 251, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255,255,255,0.8)', font: { size: 12 } }
                }
            }
        }
    });
}

function drawDiabeticChart(data) {
    const ctx = document.getElementById('diabeticChart');
    if (!ctx) {
        console.warn('Diabetic chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (chartsInstances.diabeticChart) {
        chartsInstances.diabeticChart.destroy();
    }

    // Default data if not provided
    const labels = Object.keys(data).length > 0 ? Object.keys(data).map(k => k.charAt(0).toUpperCase() + k.slice(1)) : ['No', 'Yes'];
    const values = Object.keys(data).length > 0 ? Object.values(data) : [70, 30];

    chartsInstances.diabeticChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(255, 127, 80, 0.8)'
                ],
                borderColor: [
                    'rgba(67, 233, 123, 1)',
                    'rgba(255, 127, 80, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255,255,255,0.8)' }
                }
            }
        }
    });
}

/* ============================================ */
/* PREDICTION */
/* ============================================ */

async function handlePrediction(e) {
    e.preventDefault();

    const formData = {
        age: parseFloat(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        bmi: parseFloat(document.getElementById('bmi').value),
        bloodpressure: parseFloat(document.getElementById('bloodpressure').value),
        diabetic: document.getElementById('diabetic').value,
        children: parseInt(document.getElementById('children').value),
        smoker: document.getElementById('smoker').value,
        region: document.getElementById('region').value
    };

    console.log('📊 Sending prediction with data:', formData);

    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const submitBtn = document.querySelector('.predict-btn');

    // Show loading state
    btnSpinner.classList.add('active');
    btnText.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        console.log('Prediction response status:', response.status);
        const data = await response.json();
        console.log('Prediction response data:', data);

        if (response.ok) {
            console.log('✅ Prediction successful, displaying result');
            displayPredictionResult(data);
            
            // Reload history after a short delay to ensure database has processed the write
            console.log('⏳ Waiting 1 second before reloading history...');
            setTimeout(async () => {
                console.log('🔄 Now reloading history');
                await loadHistory();
            }, 1000);
        } else {
            console.error('Prediction error:', data.error);
            alert('Error: ' + (data.error || 'Prediction failed'));
        }
    } catch (error) {
        console.error('Prediction error:', error);
        alert('Connection error. Please try again.');
    } finally {
        // Restore button state
        btnSpinner.classList.remove('active');
        btnText.textContent = 'Get AI Prediction';
        submitBtn.disabled = false;
    }
}

function displayPredictionResult(data) {
    const resultContainer = document.getElementById('predictionResult');
    const cost = data.predicted_cost;
    const summary = data.input_summary;

    const html = `
        <div class="result-card">
            <div class="result-header">
                <div class="result-cost-label">💰 Predicted Annual Insurance Cost</div>
                <div class="result-cost-value">₹${cost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                <div class="result-cost-subtext">Based on AI-Powered Machine Learning Model</div>
            </div>
            
            <div class="result-summary">
                <div class="summary-title">📋 Input Summary</div>
                <div class="summary-items">
                    <div class="summary-item">
                        <div class="summary-label">Age</div>
                        <div class="summary-value">${summary.age} years</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Gender</div>
                        <div class="summary-value">${summary.gender}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">BMI</div>
                        <div class="summary-value">${summary.bmi}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Blood Pressure</div>
                        <div class="summary-value">${summary.bloodpressure} mmHg</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Diabetic</div>
                        <div class="summary-value">${summary.diabetic}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Smoker</div>
                        <div class="summary-value">${summary.smoker}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Children</div>
                        <div class="summary-value">${summary.children}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Region</div>
                        <div class="summary-value">${summary.region}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultContainer.innerHTML = html;
    resultContainer.classList.add('active');
}

/* ============================================ */
/* HISTORY */
/* ============================================ */

function displayHistory(predictions) {
    const historyList = document.getElementById('historyList');

    if (!predictions || predictions.length === 0) {
        historyList.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 40px;">
                <p style="font-size: 24px; margin: 0;">📭</p>
                <p style="color: rgba(255,255,255,0.6); margin-top: 10px;">No predictions yet</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; gap: 16px;">';
    predictions.forEach((pred, index) => {
        let timestamp = '';
        try {
            const date = new Date(pred.timestamp);
            timestamp = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        } catch (e) {
            timestamp = pred.timestamp || 'Unknown time';
        }

        const costFormatted = pred.predicted_cost ? pred.predicted_cost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0.00';
        
        html += `
            <div style="
                background: linear-gradient(135deg, rgba(77, 208, 225, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%);
                border: 1px solid rgba(77, 208, 225, 0.3);
                border-radius: 12px;
                padding: 16px;
                transition: all 0.3s ease;
            " onmouseover="this.style.borderColor='rgba(77, 208, 225, 0.6)'; this.style.boxShadow='0 0 20px rgba(77, 208, 225, 0.2)';" 
               onmouseout="this.style.borderColor='rgba(77, 208, 225, 0.3)'; this.style.boxShadow='none';">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ⏰ ${timestamp}
                        </div>
                    </div>
                    <div style="
                        background: linear-gradient(135deg, #4dd0e1 0%, #26c6da 100%);
                        color: #000;
                        font-weight: 700;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 14px;
                    ">
                        ₹${costFormatted}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px;">
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Age</span>
                        <span style="color: #fff; font-weight: 600;">${pred.age} years</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Gender</span>
                        <span style="color: #fff; font-weight: 600;">${pred.gender ? pred.gender.charAt(0).toUpperCase() + pred.gender.slice(1) : 'N/A'}</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">BMI</span>
                        <span style="color: #fff; font-weight: 600;">${pred.bmi ? pred.bmi.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Blood Pressure</span>
                        <span style="color: #fff; font-weight: 600;">${pred.bloodpressure ? pred.bloodpressure : 'N/A'} mmHg</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Diabetic</span>
                        <span style="color: #fff; font-weight: 600;">${pred.diabetic ? pred.diabetic.charAt(0).toUpperCase() + pred.diabetic.slice(1) : 'N/A'}</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Smoker</span>
                        <span style="color: #fff; font-weight: 600;">${pred.smoker ? pred.smoker.charAt(0).toUpperCase() + pred.smoker.slice(1) : 'N/A'}</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Region</span>
                        <span style="color: #fff; font-weight: 600;">${pred.region ? pred.region.charAt(0).toUpperCase() + pred.region.slice(1) : 'N/A'}</span>
                    </div>
                    <div>
                        <span style="color: rgba(255,255,255,0.5); display: block; margin-bottom: 2px;">Children</span>
                        <span style="color: #fff; font-weight: 600;">${pred.children || 0}</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    historyList.innerHTML = html;
}

/* ============================================ */
/* MODEL RETRAINING */
/* ============================================ */

async function handleRetrain() {
    const confirmed = confirm('⚠️ This will retrain the model using all historical predictions from the database. Continue?');
    if (!confirmed) return;
    
    const retrainBtn = document.getElementById('retrainBtn');
    const originalText = retrainBtn.innerHTML;
    
    try {
        retrainBtn.disabled = true;
        retrainBtn.innerHTML = '<span class="spinner-small"></span> Retraining Model...';
        
        const response = await fetch('/api/retrain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✅ Model Retrained Successfully!\n\nTotal Records Used: ${data.total_records}\nLast Training: ${new Date(data.last_train_time).toLocaleString()}\n\nThe model is now trained on all historical data for more accurate predictions!`);
            
            // Reload stats to show updated information
            loadStats();
        } else {
            alert('❌ Retraining failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Retrain error:', error);
        alert('Connection error. Please try again.');
    } finally {
        retrainBtn.disabled = false;
        retrainBtn.innerHTML = originalText;
    }
}

/* ============================================ */
/* 3D BACKGROUND */
/* ============================================ */

function init3DBackground() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera.position.z = 5;

    // Create animated objects
    const objects = [];

    // Create rotating cubes with medical icons
    const geometries = [
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.SphereGeometry(0.4, 32, 32),
        new THREE.ConeGeometry(0.4, 0.8, 32)
    ];

    const material = new THREE.MeshPhongMaterial({
        color: 0x4dd0e1,
        wireframe: false,
        transparent: true,
        opacity: 0.3,
        emissive: 0x4dd0e1,
        emissiveIntensity: 0.2
    });

    for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(geometries[i], material.clone());
        mesh.position.x = (Math.random() - 0.5) * 8;
        mesh.position.y = (Math.random() - 0.5) * 8;
        mesh.position.z = (Math.random() - 0.5) * 5;

        const speed = Math.random() * 0.01 + 0.005;
        const rotation = {
            x: (Math.random() - 0.5) * speed,
            y: (Math.random() - 0.5) * speed,
            z: (Math.random() - 0.5) * speed
        };

        objects.push({ mesh, rotation });
        scene.add(mesh);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x4dd0e1, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        objects.forEach(obj => {
            obj.mesh.rotation.x += obj.rotation.x;
            obj.mesh.rotation.y += obj.rotation.y;
            obj.mesh.rotation.z += obj.rotation.z;

            // Gentle float animation
            obj.mesh.position.y += Math.sin(Date.now() * 0.0005) * 0.001;
        });

        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
