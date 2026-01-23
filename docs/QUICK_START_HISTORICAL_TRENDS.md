# 🚀 Quick Start: Historical Trends & Data Processing

## Step-by-Step Guide

### Step 1: Process disasterIND.csv Data

```bash
# From project root
python ml_pipeline/data_collection/process_disasterIND.py
```

**Expected Output:**
```
PROCESSING disasterIND.csv FOR ML TRAINING
============================================================
📂 Loading disasterIND.csv...
✅ Loaded 785 disaster records
[1] Initial records: 785
[2] After filtering (IND, 2000+): XXX records
[3] Standardizing disaster types...
[4] After type filtering: XXX records
[5] Extracting and calculating features...
[6] Processed XXX disaster records
✅ Saved to: ml_pipeline/data/historical/disasterIND_processed.csv
✅ Saved JSON to: ml_pipeline/data/historical/disasterIND_processed.json
```

### Step 2: Retrain ML Models (Optional but Recommended)

```bash
cd ml_pipeline
python train_relief_model.py
```

This will use the processed disasterIND data to train better models!

### Step 3: Start Backend

```bash
cd backend
npm start
```

### Step 4: Start Frontend

```bash
cd frontend
npm start
```

### Step 5: Access Historical Trends

1. Open browser: http://localhost:3000
2. Click "Historical Trends" in navigation
3. Or go directly to: http://localhost:3000/historical-trends

---

## 🎯 What You Can Do

### **Explore Visual Analytics:**
- See disaster type distribution (pie chart)
- View severity breakdown (bar chart)
- Analyze yearly trends (line chart)
- Check top affected states (bar chart)
- Explore geographic distribution (interactive map)

### **Filter by Year Range:**
- Adjust start year (2000-2023)
- Adjust end year (2000-2023)
- See filtered results update in real-time

### **View Famous Disasters:**
- Click any famous disaster from the list
- See detailed information in right panel
- View estimated relief requirements

### **Interact with Map:**
- Click markers to see disaster details
- Zoom in/out to explore regions
- See up to 50 disasters on map

---

## 📊 Data Statistics

After processing, you should see:
- **100+ disaster records** (from 2000-2023)
- **Multiple disaster types**
- **All Indian states covered**
- **Rich feature set** for ML training

---

## ✅ Verification

### Check if Data Processed:
```bash
# Check if files exist
ls ml_pipeline/data/historical/disasterIND_processed.*
```

### Check Backend API:
```bash
curl http://localhost:5000/api/disasters/historical
```

Should return JSON with disaster data.

### Check Frontend:
- Navigate to Historical Trends page
- Should see charts and data
- If no data, famous disasters will show as fallback

---

## 🎉 You're All Set!

Your Historical Trends page is ready with:
- ✅ Real historical data from disasterIND.csv
- ✅ Visual analytics dashboard
- ✅ Year range filtering
- ✅ Famous disasters list
- ✅ Interactive map
- ✅ Click-to-view details

**Enjoy exploring India's disaster history! 📊🇮🇳**

