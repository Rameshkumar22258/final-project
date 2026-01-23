# 🚨 MANUAL BACKEND START REQUIRED

## The Problem
The backend server is **NOT running**. Background start attempts aren't working reliably.

## ✅ SOLUTION: Start Manually (REQUIRED)

### Step 1: Open a NEW Terminal Window
- **In VS Code:** Press `` Ctrl + Shift + ` `` (backtick key)
- **Or:** Open PowerShell/Command Prompt separately
- **IMPORTANT:** This must be a **separate window** from your frontend terminal

### Step 2: Navigate to Backend Folder
```bash
cd C:\Users\chait\swasthyasetu\backend
```

### Step 3: Install Dependencies (if needed)
```bash
npm install
```
*(Only needed if you see "module not found" errors)*

### Step 4: Start the Server
```bash
npm start
```

### Step 5: Look for This Output
You should see:
```
============================================================
🚀 SwasthyaSetu - Disaster Relief AI Backend Server
============================================================
✓ Server running on port 5000
✓ Environment: development
✓ API Base URL: http://localhost:5000/api
✓ MongoDB: Connected (or Disconnected - still works)
============================================================
```

### Step 6: Keep Terminal Open
**DO NOT CLOSE** the terminal window. The server must stay running.

### Step 7: Test It
1. Open browser: `http://localhost:5000/api/health`
2. Should return: `{"status":"ok","message":"API is healthy"}`
3. **Refresh your frontend page** - errors should be gone!

## If npm start Fails

### Check for Errors
Look at the terminal output. Common issues:

1. **"Cannot find module"**
   ```bash
   npm install
   ```

2. **"Port 5000 already in use"**
   ```bash
   # Find what's using port 5000
   netstat -ano | findstr :5000
   # Kill it (replace <PID> with number from above)
   taskkill /PID <PID> /F
   ```

3. **"MongoDB connection error"**
   - This is OK! Server will run in "in-memory mode"
   - You'll see: `⚠️ Running in IN-MEMORY MODE`

## Quick Alternative: Use the Batch File

If you prefer, double-click:
```
START_BACKEND.bat
```
in your project root folder.

## Why Manual Start?

- Background processes in Windows can be unreliable
- You need to see error messages if something goes wrong
- You need to keep the terminal open to keep the server running

## Current Status

- ❌ **Backend:** NOT RUNNING (needs manual start)
- ✅ **Frontend:** Running on port 3001
- ⚠️ **Action Required:** Start backend manually in a new terminal

**Please start the backend now using the steps above!**

