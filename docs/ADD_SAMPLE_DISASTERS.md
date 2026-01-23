# How to Add Sample Active Disasters

## Problem
You're not seeing any active disasters because the database is empty or doesn't have any disasters with `status: 'active'` detected within the last 7 days.

## Solution: Create Sample Disasters

### Option 1: Use the API Endpoint (Easiest)

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/disasters/create-sample
```

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/disasters/create-sample" -Method POST
```

**Using Browser/Postman:**
- URL: `POST http://localhost:5000/api/disasters/create-sample`
- No body needed

This will create 4 sample active disasters:
1. **Flood in Mumbai** (High severity)
2. **Earthquake in Uttarakhand** (Critical severity)
3. **Cyclone in Odisha** (High severity)
4. **Landslide in Himachal Pradesh** (Medium severity)

### Option 2: Create Disasters Manually via API

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/disasters/create \
  -H "Content-Type: application/json" \
  -d '{
    "disaster_id": "FLOOD_MUMBAI_001",
    "title": "Heavy Flooding in Mumbai",
    "disaster_type": "flood",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "coordinates": {
        "latitude": 19.0760,
        "longitude": 72.8777
      }
    },
    "severity": "high",
    "displaced": 5000,
    "casualties": 12,
    "status": "active",
    "description": "Heavy monsoon rains causing flooding"
  }'
```

### Option 3: Check What's in Database

**Get all disasters:**
```bash
curl http://localhost:5000/api/disasters/active
```

**Get stats:**
```bash
curl http://localhost:5000/api/disasters/stats
```

## After Creating Sample Data

1. **Refresh the Analytics page** - You should now see:
   - Active Disasters count: 4
   - Disaster type distribution
   - Severity breakdown
   - Geographic distribution

2. **Check Dashboard** - Should show active disasters list

3. **Check Map View** - Should show markers for each disaster

## Notes

- Sample disasters are created with `detected_at` set to recent dates (within last 7 days)
- They have `status: 'active'` so they'll appear in active disasters queries
- If you run the endpoint multiple times, it won't create duplicates (checks for existing `disaster_id`)

## Troubleshooting

**If you still don't see disasters:**
1. Check backend is running: `http://localhost:5000/api/health`
2. Check MongoDB connection
3. Check browser console for errors
4. Verify the API call succeeded (check response)

**To clear and recreate:**
- You can manually delete disasters from MongoDB or use the update endpoint to change status to 'resolved'

