# Fix: recharts Module Not Found

## Quick Fix

Run this command in your terminal:

```bash
cd frontend
npm install recharts
```

Then restart your frontend server:

```bash
npm start
```

## Alternative: If npm install doesn't work

1. Delete `node_modules` and `package-lock.json`:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   ```

2. Reinstall all dependencies:
   ```bash
   npm install
   ```

3. Restart the server:
   ```bash
   npm start
   ```

## Verification

After installation, check that `recharts` is in `package.json`:

```json
"dependencies": {
  ...
  "recharts": "^2.10.3",
  ...
}
```

The package.json has been updated to include recharts. Just run `npm install` in the frontend directory.

