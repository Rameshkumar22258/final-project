# ⚡ QUICK FIX: Backend Not Running

## The Problem
Backend server on port 5000 is **NOT running**, causing all API calls to fail.

## ✅ SOLUTION (Do This Now)

### Step 1: Open a NEW Terminal Window
- Press `Ctrl + Shift + `` (backtick) in VS Code, OR
- Open PowerShell/Command Prompt separately

### Step 2: Navigate to Backend Folder
```bash
cd C:\Users\chait\swasthyasetu\backend
```

### Step 3: Start the Server
```bash
npm start
```

### Step 4: Wait for This Message
You should see:
```
============================================================
🚀 SwasthyaSetu - Disaster Relief AI Backend Server
============================================================
✓ Server running on port 5000
✓ API Base URL: http://localhost:5000/api
============================================================
```

### Step 5: Keep Terminal Open
**DO NOT CLOSE** the terminal window. The server must stay running.

### Step 6: Test It Works
1. Open browser: `http://localhost:5000/api/health`
2. Should see: `{"status":"ok","message":"API is healthy"}`
3. Refresh your frontend page
4. Try prediction again - should work!

## If npm start Fails

### Install Dependencies First
```bash
cd backend
npm install
npm start
```

### Check for Port Conflicts
```bash
# See what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace <PID> with number from above)
taskkill /PID <PID> /F
```

### Use Different Port
If port 5000 is stuck, use port 5001:

1. Create `backend/.env`:
   ```
   PORT=5001
   ```

2. Update `frontend/src/services/api.js` line 4:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
   ```

3. Restart both frontend and backend

## Why This Happens

- Backend must be running separately from frontend
- Frontend (port 3001) and Backend (port 5000) are different servers
- Both must be running at the same time

## Current Status

❌ **Backend: NOT RUNNING** - You need to start it manually
✅ **Frontend: Running** (on port 3001)

## After Starting Backend

✅ All errors will disappear
✅ Predictions will work
✅ Dashboard will load data
✅ Everything will function normally

**Start the backend now and refresh your browser!**

