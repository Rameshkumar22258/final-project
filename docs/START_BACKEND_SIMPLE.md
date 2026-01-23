# 🚀 START BACKEND SERVER - SIMPLE STEPS

## ⚡ QUICK START (Choose One Method)

### Method 1: PowerShell Script (Easiest)

1. **Right-click** on `start-backend.ps1` in your project folder
2. Select **"Run with PowerShell"**
3. Wait for: `✓ Server running on port 5000`
4. **Keep the window open**
5. Refresh your browser

### Method 2: Batch File

1. **Double-click** `START_BACKEND.bat` in your project folder
2. Wait for: `✓ Server running on port 5000`
3. **Keep the window open**
4. Refresh your browser

### Method 3: Manual Command

1. **Open a NEW terminal/PowerShell window**
2. **Copy and paste** these commands one by one:

```bash
cd C:\Users\chait\swasthyasetu\backend
npm start
```

3. Wait for: `✓ Server running on port 5000`
4. **Keep the window open**
5. Refresh your browser

## ✅ How to Know It's Working

You should see in the terminal:
```
============================================================
🚀 SwasthyaSetu - Disaster Relief AI Backend Server
============================================================
✓ Server running on port 5000
✓ API Base URL: http://localhost:5000/api
============================================================
```

## 🧪 Test It

1. Open browser: `http://localhost:5000/api/health`
2. Should see: `{"status":"ok","message":"API is healthy"}`
3. **Refresh your frontend page** - error should be gone!

## ⚠️ IMPORTANT

- **Keep the backend terminal window OPEN**
- Closing it will stop the server
- You need BOTH frontend (3001) AND backend (5000) running

## 🔄 After Starting

1. ✅ Backend terminal shows "Server running on port 5000"
2. ✅ Health check works: `http://localhost:5000/api/health`
3. ✅ Refresh your browser
4. ✅ Try prediction - should work now!

**Start the backend using one of the methods above!**

