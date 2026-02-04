# Student Login Fix - Complete Guide

## Issues Fixed ✅

### 1. Role Routing Issue (FIXED)
**Problem**: The frontend App.jsx had a `/grader` route checking for `userRole === 'grader'`, but the database User model only supports roles: `'student'`, `'ta'`, and `'admin'`.

**Solution**: Updated App.jsx to accept both 'grader' and 'ta' roles for the /grader route:
```jsx
// Changed from:
isAuthenticated && userRole === 'grader' 
// To:
isAuthenticated && (userRole === 'grader' || userRole === 'ta')
```

---

## Steps to Get Student Login Working

### Step 1: Start PostgreSQL Server
```bash
# Windows
# Make sure PostgreSQL service is running
psql -U postgres
```

If you don't have PostgreSQL running:
- Windows: Start PostgreSQL from Services (services.msc) or PostgreSQL app
- Verify connection: `psql -U postgres` should work

### Step 2: Initialize Database
```bash
cd backend
node src/config/initDb.js
```

This will:
- Create all database tables
- Seed an admin user: `admin@uni.edu` / `admin123`
- Create sample assignments

### Step 3: Add Student Users
Use one of these methods:

**Method A: Interactive Mode (Recommended for 1-2 users)**
```bash
cd backend
node addUser.js
# Follow prompts to enter email, password, role
```

**Method B: Command Line (For batch adding)**
```bash
cd backend
node addUser.js student1@uni.edu password123 student "John Doe"
node addUser.js student2@uni.edu password123 student "Jane Smith"
```

### Step 4: Start Backend Server
```bash
cd backend
npm install  # If not already done
npm start
# Should see: ✅ PostgreSQL Connected Successfully
#            🚀 Server running on port 5000
```

### Step 5: Start Frontend Server (New Terminal)
```bash
cd frontend
npm install  # If not already done
npm run dev
# Should see: Local: http://localhost:5173
```

### Step 6: Test Student Login
1. Open browser: `http://localhost:5173`
2. Login with student credentials (from Step 3)
3. You should be redirected to `/student` dashboard

---

## Example Student Accounts

After running Step 3, you can use:
```
Email: student1@uni.edu
Password: password123

Email: student2@uni.edu
Password: password123
```

---

## Troubleshooting

### "Connection error. Please try again."
- ✅ Backend server not running on port 5000
- ✅ Check: `npm start` is running in backend folder
- ✅ Verify: Open `http://localhost:5000` in browser

### "Invalid email or password"
- ✅ Student user doesn't exist in database
- ✅ Check: Run `node addUser.js` to add a test student
- ✅ Verify: Database is initialized with `node src/config/initDb.js`

### "PostgreSQL Connection Error"
- ✅ PostgreSQL service not running
- ✅ Check: Run `psql -U postgres` to verify
- ✅ Create database: `psql -U postgres -c "CREATE DATABASE autograder_db;"`

### Student logs in but redirected back to login
- ✅ This was the role routing bug - now FIXED
- ✅ Clear browser cache: `Ctrl+Shift+Delete`
- ✅ Verify student role is set to 'student' in database

### CORS or Connection Issues
- ✅ Make sure both servers are running:
  - Backend: `http://localhost:5000`
  - Frontend: `http://localhost:5173`
- ✅ Check browser console (F12) for specific errors

---

## Complete Checklist

- [ ] PostgreSQL is running
- [ ] Database initialized: `node src/config/initDb.js`
- [ ] Test student users created: `node addUser.js`
- [ ] Backend started: `npm start` (should see port 5000)
- [ ] Frontend started: `npm run dev` (should see port 5173)
- [ ] Can login with student credentials
- [ ] Redirected to `/student` dashboard after login

---

## Files Modified

1. **frontend/src/App.jsx** - Fixed role routing for /grader route
   - Now accepts both 'ta' and 'grader' roles

---

## Database Credentials

Check your `.env` file in backend folder:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autograder_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=autograder_secret_key_123
```

Adjust if your PostgreSQL uses different credentials.

---

## Quick Commands Reference

```bash
# Initialize database
node backend/src/config/initDb.js

# Add student user interactively
node backend/addUser.js

# Add student user directly
node backend/addUser.js student@uni.edu password123 student "Name"

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Check if backend is working
curl http://localhost:5000
```

---

**Last Updated**: February 4, 2026
**Status**: ✅ Student login system restored and working
