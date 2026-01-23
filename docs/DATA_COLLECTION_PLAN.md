# 📊 Historical Disaster Data Collection Plan

## 🎯 Objective

Collect **1000+ historical Indian disaster records** with relief data to train the prediction model with **85%+ accuracy**.

---

## 📋 Required Data Fields

### Disaster Information
```json
{
  "disaster_id": "DIS_2023_MH_001",
  "date": "2023-07-15",
  "disaster_type": "flood",
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "district": "Mumbai Suburban",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "severity": "high",
  "affected_area_km2": 150,
  "duration_days": 7,
  "casualties": 45,
  "injured": 120,
  "displaced": 50000,
  "buildings_damaged": 5000
}
```

### Relief Provided (TARGET VARIABLE)
```json
{
  "relief_data": {
    "food_packets_distributed": 100000,
    "water_liters_supplied": 200000,
    "medical_teams_deployed": 50,
    "doctors": 150,
    "nurses": 300,
    "rescue_personnel": 200,
    "ndrf_teams": 20,
    "temporary_shelters_setup": 500,
    "tent_capacity": 25000,
    "financial_aid_inr": 50000000,
    "compensation_per_family": 25000,
    "relief_camps": 30,
    "ambulances": 40,
    "rescue_boats": 25,
    "helicopters_used": 5
  },
  "response_time_hours": 6,
  "recovery_duration_days": 30
}
```

### Geographic Features
```json
{
  "geographic_features": {
    "topography": "coastal",
    "climate_zone": "tropical",
    "elevation_m": 14,
    "population_density_per_km2": 20694,
    "urbanization": "metropolitan",
    "proximity_to_water": true,
    "distance_to_coast_km": 0,
    "avg_annual_rainfall_mm": 2200,
    "soil_type": "alluvial",
    "vegetation_cover": "low"
  }
}
```

---

## 📚 Data Sources

### 1. **National Disaster Management Authority (NDMA)** ⭐ PRIMARY
- **URL**: https://ndma.gov.in/
- **Data Available**: 
  - Annual reports (2015-2025)
  - State-wise disaster reports
  - Response guidelines
  - Capacity building documents

**How to Extract**:
```python
# Scrape NDMA annual reports
import requests
from bs4 import BeautifulSoup
import PyPDF2

# Download PDFs
pdf_urls = [
    'https://ndma.gov.in/sites/default/files/PDF/Annual-Report-2022-23.pdf',
    # ... more years
]

# Extract tables from PDFs
# Look for: Disaster name, date, location, casualties, relief provided
```

**Expected Records**: 200-300 disasters

---

### 2. **State Disaster Management Authorities**
- **Maharashtra**: https://dm.maharashtra.gov.in/
- **Kerala**: https://sdma.kerala.gov.in/
- **Assam**: https://sdmassam.nic.in/
- **Uttarakhand**: https://dmmc.uk.gov.in/
- **Gujarat**: https://gsdma.org/
- **Tamil Nadu**: https://tnsdma.tn.gov.in/

**Data Available**: Detailed state-level reports with relief breakdowns

**Expected Records**: 300-400 disasters

---

### 3. **National Disaster Response Force (NDRF)**
- **URL**: https://ndrf.gov.in/
- **Data**: Deployment statistics, operation reports

**Expected Records**: 100-150 operations

---

### 4. **India Meteorological Department (IMD)**
- **URL**: https://mausam.imd.gov.in/
- **Data**: Cyclone, flood, weather-related disaster data

**Expected Records**: 150-200 weather disasters

---

### 5. **EM-DAT (International Disaster Database)**
- **URL**: https://www.emdat.be/
- **Data**: Comprehensive disaster database
- **Filter**: Country = India, Years = 2015-2025
- **Cost**: Free for research/non-commercial

**How to Access**:
1. Register at https://public.emdat.be/
2. Download India disaster data (CSV format)
3. Includes: casualties, affected population, economic damage

**Expected Records**: 200-300 disasters

---

### 6. **Government Press Releases & PIB**
- **URL**: https://pib.gov.in/
- **Search**: Disaster relief, NDRF, evacuation
- **Data**: Official government relief statistics

**Expected Records**: 100-150 disasters

---

### 7. **News Archives (Your Filtered Data)**
- **Source**: Your news_api_collector.py
- **Time Range**: 2020-2025 (past 5 years)
- **Extract**: Disaster details from articles
- **Cross-reference**: With official sources for relief data

**Expected Records**: 100-200 recent disasters

---

### 8. **Academic Research Papers**
- **Sources**:
  - Google Scholar
  - ResearchGate
  - Indian journals (IJDR - Indian Journal of Disaster Recovery)
- **Search Terms**:
  - "India disaster relief statistics"
  - "flood relief operations India"
  - "disaster management case study India"

**Expected Records**: 50-100 well-documented cases

---

## 🛠️ Data Collection Scripts

### Script 1: NDMA PDF Scraper
```python
# ml_pipeline/data_collection/scrape_ndma_reports.py

import requests
import PyPDF2
import pandas as pd
import re
from io import BytesIO

def download_ndma_report(year):
    """Download NDMA annual report for given year"""
    url = f"https://ndma.gov.in/sites/default/files/PDF/Annual-Report-{year}.pdf"
    response = requests.get(url)
    return BytesIO(response.content)

def extract_disaster_data(pdf_file):
    """Extract disaster data from PDF"""
    reader = PyPDF2.PdfReader(pdf_file)
    
    disasters = []
    for page in reader.pages:
        text = page.extract_text()
        
        # Extract patterns like:
        # "Flood in Kerala, July 2023, 50 casualties, 100000 affected"
        # Use regex to find disaster mentions
        
    return disasters

# Run for years 2015-2024
all_disasters = []
for year in range(2015, 2025):
    pdf = download_ndma_report(year)
    disasters = extract_disaster_data(pdf)
    all_disasters.extend(disasters)

df = pd.DataFrame(all_disasters)
df.to_csv('../data/historical_disasters_ndma.csv', index=False)
```

---

### Script 2: EM-DAT Data Downloader
```python
# ml_pipeline/data_collection/emdat_downloader.py

import pandas as pd

def load_emdat_data():
    """
    Manual steps:
    1. Go to https://public.emdat.be/
    2. Register (free)
    3. Download India disasters (2015-2025)
    4. Save as emdat_india.csv
    """
    df = pd.read_csv('../data/emdat_india.csv')
    
    # Clean and standardize
    df_clean = clean_emdat_data(df)
    
    return df_clean

def clean_emdat_data(df):
    """Standardize EM-DAT data to our format"""
    df_standardized = pd.DataFrame({
        'disaster_id': df['Dis No'],
        'date': pd.to_datetime(df['Start Date']),
        'disaster_type': df['Disaster Type'].str.lower(),
        'location': df['Location'],
        'casualties': df['Total Deaths'].fillna(0),
        'affected': df['Total Affected'].fillna(0),
        'damage_usd': df['Total Damage (\'000 US$)'].fillna(0) * 1000,
        # ... map more fields
    })
    
    return df_standardized
```

---

### Script 3: Web Scraper for State Websites
```python
# ml_pipeline/data_collection/scrape_state_reports.py

import requests
from bs4 import BeautifulSoup
import pandas as pd

STATE_URLS = {
    'Maharashtra': 'https://dm.maharashtra.gov.in/disaster-reports',
    'Kerala': 'https://sdma.kerala.gov.in/reports/',
    # ... more states
}

def scrape_state_disasters(state_name, url):
    """Scrape disaster reports from state website"""
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find report links
    reports = soup.find_all('a', href=re.compile(r'report|disaster'))
    
    disasters = []
    for report in reports:
        # Extract disaster data from each report
        disaster_data = extract_from_report(report['href'])
        disasters.append(disaster_data)
    
    return disasters

# Scrape all states
all_disasters = []
for state, url in STATE_URLS.items():
    disasters = scrape_state_disasters(state, url)
    all_disasters.extend(disasters)

df = pd.DataFrame(all_disasters)
df.to_csv('../data/historical_disasters_states.csv', index=False)
```

---

### Script 4: Relief Data Augmentation
```python
# ml_pipeline/data_collection/augment_relief_data.py

import pandas as pd

def estimate_relief_from_affected(disaster):
    """
    If relief data is missing, estimate based on:
    - Number of people affected
    - Disaster severity
    - Historical averages
    """
    
    # Rule-based estimation (backup when actual data unavailable)
    people_affected = disaster['displaced']
    disaster_type = disaster['disaster_type']
    duration = disaster['duration_days']
    
    # Standard relief ratios (from NDMA guidelines)
    relief = {
        'food_packets': people_affected * 3 * duration,  # 3 meals/day
        'water_liters': people_affected * 10 * duration,  # 10L/person/day
        'medical_teams': max(1, people_affected // 1000),  # 1 team per 1000
        'shelters': people_affected // 50,  # 1 shelter for 50 people
        'financial_aid': people_affected * 25000,  # ₹25k per family
    }
    
    return relief

# Apply to incomplete records
df = pd.read_csv('../data/historical_disasters_combined.csv')
df['relief_estimated'] = df.apply(estimate_relief_from_affected, axis=1)
df.to_csv('../data/historical_disasters_with_relief.csv', index=False)
```

---

## 📥 Step-by-Step Collection Process

### Week 1: Government Sources
- [ ] Download NDMA annual reports (2015-2024)
- [ ] Extract disaster data using PyPDF2
- [ ] Register and download EM-DAT data
- [ ] Scrape NDRF operation reports
- [ ] **Target**: 300-400 records

### Week 2: State Sources
- [ ] Scrape top 10 state disaster websites
- [ ] Download PDF reports from states
- [ ] Extract data from state bulletins
- [ ] **Target**: 300-400 records

### Week 3: News & Academic Sources
- [ ] Run news_api_collector.py for past 5 years
- [ ] Search academic papers for case studies
- [ ] Extract data from research papers
- [ ] **Target**: 150-200 records

### Week 4: Cleaning & Validation
- [ ] Combine all data sources
- [ ] Remove duplicates
- [ ] Standardize formats
- [ ] Fill missing relief data (estimate if needed)
- [ ] Validate data quality
- [ ] **Target**: 1000+ clean records

---

## 🧹 Data Cleaning Pipeline

```python
# ml_pipeline/data_collection/clean_historical_data.py

import pandas as pd
import numpy as np

def clean_and_merge_all_sources():
    """Combine data from all sources"""
    
    # Load all sources
    ndma = pd.read_csv('../data/ndma_disasters.csv')
    emdat = pd.read_csv('../data/emdat_india.csv')
    states = pd.read_csv('../data/state_disasters.csv')
    news = pd.read_csv('../data/news_disasters.csv')
    
    # Standardize column names
    ndma = standardize_columns(ndma, source='ndma')
    emdat = standardize_columns(emdat, source='emdat')
    states = standardize_columns(states, source='states')
    news = standardize_columns(news, source='news')
    
    # Combine
    all_disasters = pd.concat([ndma, emdat, states, news], ignore_index=True)
    
    # Remove duplicates (same disaster from multiple sources)
    all_disasters = remove_duplicates(all_disasters)
    
    # Fill missing values
    all_disasters = fill_missing_values(all_disasters)
    
    # Validate
    all_disasters = validate_data(all_disasters)
    
    # Save
    all_disasters.to_csv('../data/historical_disasters_cleaned.csv', index=False)
    
    print(f"✅ Cleaned data: {len(all_disasters)} disasters")
    print(f"   Date range: {all_disasters['date'].min()} to {all_disasters['date'].max()}")
    print(f"   States covered: {all_disasters['state'].nunique()}")
    print(f"   Disaster types: {all_disasters['disaster_type'].unique()}")

def remove_duplicates(df):
    """Identify and merge duplicate disaster records"""
    # Consider duplicates if:
    # - Same date (±3 days)
    # - Same location
    # - Same disaster type
    
    df_dedup = df.drop_duplicates(subset=['date', 'location', 'disaster_type'], keep='first')
    return df_dedup

def fill_missing_values(df):
    """Intelligent missing value filling"""
    # If relief data missing, estimate from similar disasters
    # Use KNN to find similar disasters
    from sklearn.impute import KNNImputer
    
    imputer = KNNImputer(n_neighbors=5)
    df[['food_packets', 'water_liters', 'shelters']] = imputer.fit_transform(
        df[['food_packets', 'water_liters', 'shelters']]
    )
    
    return df

if __name__ == "__main__":
    clean_and_merge_all_sources()
```

---

## 📊 Expected Final Dataset Statistics

```
Total Records: 1000-1200 disasters
Time Range: 2015-2025 (10 years)
Geographic Coverage: All Indian states
Disaster Types:
  - Floods: 400-500 records (40-45%)
  - Cyclones: 100-150 records (10-15%)
  - Earthquakes: 80-100 records (8-10%)
  - Landslides: 150-200 records (15-20%)
  - Droughts: 100-150 records (10-15%)
  - Others: 100-150 records (10-15%)

States Covered: All 28 states + 8 UTs
Top States: Maharashtra, Kerala, Assam, Uttarakhand, Gujarat

Relief Data Completeness:
  - Full relief data: 600-700 records (60-70%)
  - Partial relief data: 200-300 records (20-30%)
  - Estimated relief data: 100-200 records (10-20%)
```

---

## ✅ Data Quality Checklist

- [ ] All records have date, location, disaster_type
- [ ] Coordinates (lat/lng) validated
- [ ] No duplicate disasters
- [ ] Relief data available or estimated for all records
- [ ] Geographic features populated
- [ ] Population data fetched
- [ ] Data spans 2015-2025
- [ ] At least 1000 records
- [ ] All major Indian states covered
- [ ] Multiple disaster types represented

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
pip install requests beautifulsoup4 PyPDF2 pandas geopy

# 2. Create data directory
mkdir -p ml_pipeline/data/raw

# 3. Run collectors (in sequence)
python ml_pipeline/data_collection/scrape_ndma_reports.py
python ml_pipeline/data_collection/scrape_state_reports.py
python ml_pipeline/data_collection/emdat_downloader.py

# 4. Clean and merge
python ml_pipeline/data_collection/clean_historical_data.py

# 5. Verify
python ml_pipeline/data_collection/verify_data_quality.py
```

---

## 📖 Additional Resources

- **NDMA Guidelines**: https://ndma.gov.in/Natural-Hazards
- **EM-DAT User Guide**: https://doc.emdat.be/
- **Indian Disaster Stats**: https://nidm.gov.in/
- **Census India**: https://censusindia.gov.in/

---

## 🎯 Success Criteria

✅ **1000+ historical disaster records**  
✅ **60%+ with actual relief data** (rest estimated)  
✅ **All major states covered**  
✅ **10 years of data (2015-2025)**  
✅ **Clean, standardized format**  
✅ **Ready for model training**

---

**Once this data is collected, you'll have the foundation for a highly accurate relief prediction model!** 🚀












