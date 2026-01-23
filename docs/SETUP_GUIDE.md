# Quick Setup Guide - Disaster Relief AI

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Prerequisites

**Windows:**
```powershell
# Install Node.js from https://nodejs.org/
# Install Python from https://python.org/
# Install MongoDB from https://mongodb.com/try/download/community
```

**macOS:**
```bash
brew install node python mongodb-community
```

**Linux:**
```bash
sudo apt update
sudo apt install nodejs npm python3 python3-pip mongodb
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Python ML
cd ..
pip install -r requirements.txt
```

### Step 3: Configure Environment

```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env and set:
# MONGODB_URI=mongodb://localhost:27017/disaster_relief_ai
# PORT=5000

# Frontend configuration  
cd ../frontend
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### Step 4: Start Services

**Terminal 1 - MongoDB:**
```bash
# Start MongoDB
mongod
# Or on Windows: net start MongoDB
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

**Terminal 4 - ML Pipeline (Optional):**
```bash
python ml_pipeline/main_pipeline.py
```

### Step 5: Access Application

Open browser to: **http://localhost:3000**

---

## 🎯 First-Time Usage

### 1. Generate Your First Prediction

1. Click "Prediction" in navigation
2. Fill in the form:
   - Disaster Type: Flood
   - Region: West India
   - Population Density: High
   - Severity: High
   - Historical Events: 3
3. Click "Generate AI Prediction"
4. View predicted resource requirements

### 2. Explore Dashboard

- Navigate to "Dashboard"
- View active disasters
- Check risk assessments
- Monitor resource availability

### 3. View Map

- Click "Map View"
- See disaster locations on map
- Click markers for details

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
```bash
# Check if MongoDB is running
# Windows:
sc query MongoDB

# Mac/Linux:
brew services list  # macOS
sudo systemctl status mongod  # Linux
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Module not found"
**Solution:**
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Issue: "NLTK data not found"
**Solution:**
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
```

---

## 📊 Testing the System

### Test Prediction API
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "disasterType": "flood",
    "region": "west",
    "severity": "high",
    "populationDensity": "high",
    "historicalEvents": 3
  }'
```

### Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

---

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Backend server started on port 5000
- [ ] Frontend app started on port 3000
- [ ] Can access http://localhost:3000
- [ ] Dashboard loads successfully
- [ ] Can generate predictions
- [ ] Map view displays correctly

---

## 🎓 Next Steps

1. **Run ML Pipeline:**
   ```bash
   python ml_pipeline/main_pipeline.py
   ```

2. **Explore Features:**
   - Try different prediction scenarios
   - Monitor real-time feeds
   - Analyze historical data
   - View disaster maps

3. **Customize:**
   - Add your own data sources
   - Modify prediction parameters
   - Customize UI theme

---

## 💡 Tips

- **Development Mode:** Both frontend and backend auto-reload on changes
- **API Documentation:** Check `backend/server.js` for all endpoints
- **Sample Data:** System includes sample disaster data
- **Browser Console:** Check for helpful debug messages

---

## 📞 Getting Help

If you encounter issues:
1. Check error messages in terminal
2. Review browser console (F12)
3. Verify all prerequisites are installed
4. Ensure all environment variables are set
5. Check MongoDB connection

---

**Happy Coding! 🎉**














