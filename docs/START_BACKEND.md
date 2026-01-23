# 🚀 How to Start Backend Server

## Quick Start

**Open a NEW terminal window** and run:

```bash
cd backend
npm start
```

## What You Should See

When the backend starts successfully, you'll see:

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

## Verify It's Running

1. **Check the terminal** - Should show "Server running on port 5000"
2. **Test in browser:** Open `http://localhost:5000/api/health`
   - Should return: `{"status":"ok","message":"API is healthy"}`

## Common Issues

### Port 5000 Already in Use

If you see "Port 5000 is already in use":

1. **Find what's using it:**
   ```bash
   netstat -ano | findstr :5000
   ```

2. **Kill the process:**
   ```bash
   taskkill /PID <PID_NUMBER> /F
   ```

3. **Or use a different port:**
   - Create `backend/.env` file:
     ```
     PORT=5001
     ```
   - Update `frontend/src/services/api.js`:
     ```javascript
     const API_BASE_URL = 'http://localhost:5001/api';
     ```

### MongoDB Connection Error

The backend will still work even if MongoDB is not connected. It will run in "in-memory mode" and show:
```
⚠️  Running in IN-MEMORY MODE (data will not persist)
```

This is fine for testing!

### Node Modules Not Installed

If you see module errors:

```bash
cd backend
npm install
```

## Keep Terminal Open

**Important:** Keep the terminal window open while using the app. Closing it will stop the backend server.

## Status

✅ Backend server should be starting now
⚠️ If errors appear, check the terminal output for specific messages

