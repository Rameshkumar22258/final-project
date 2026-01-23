# 🔧 Backend Server Not Running - Fix Instructions

## Issue
The backend server on port 5000 is not running, causing `ERR_CONNECTION_REFUSED` errors.

## Solution

### Option 1: Start Backend Server (Recommended)

Open a **new terminal window** and run:

```bash
cd backend
npm start
```

You should see:
```
✓ Server running on port 5000
✓ API Base URL: http://localhost:5000/api
```

### Option 2: Check if Port 5000 is Already in Use

If port 5000 is already occupied, you can:

1. **Find and kill the process:**
   ```bash
   netstat -ano | findstr :5000
   # Note the PID from the output
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Or use a different port:**
   - Edit `backend/.env` or `backend/server.js`
   - Change `PORT=5000` to `PORT=5001`
   - Update `frontend/src/services/api.js` to use port 5001

### Option 3: Use Development Mode (with auto-reload)

```bash
cd backend
npm run dev
```

## Verify Backend is Running

Once started, test the health endpoint:
- Open browser: `http://localhost:5000/api/health`
- Should return: `{"status":"ok","message":"API is healthy"}`

## Common Issues

1. **MongoDB not running** - Backend will still work in "in-memory mode"
2. **Port already in use** - Kill the process or use different port
3. **Node modules not installed** - Run `npm install` in backend folder

## Status

✅ Backend server should now be starting in the background
⚠️ If errors persist, check the terminal output for specific error messages

