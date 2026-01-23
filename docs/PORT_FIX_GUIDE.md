# Port 3000 Already in Use - Solutions

## Option 1: Run on Different Port (Easiest) ✅

I've updated the start script to use port **3001** by default.

**Start the frontend:**
```bash
cd frontend
npm start
```

**Access at:** http://localhost:3001

---

## Option 2: Kill Process on Port 3000

### Windows PowerShell:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID from above)
taskkill /PID <PID> /F
```

### Windows CMD:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Option 3: Use Port 3000 (After Killing)

If you want to use port 3000 specifically:

1. Kill the process on port 3000 (see Option 2)
2. Run:
```bash
cd frontend
npm run start:3000
```

---

## Quick Fix (Recommended)

Just use port 3001 - it's already configured:

```bash
cd frontend
npm start
```

Then access: **http://localhost:3001**

The backend is still on port 5000, so make sure your API calls are configured correctly.

---

## Update API URL (if needed)

If the frontend can't connect to backend, check `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

This should already be correct for port 5000.

