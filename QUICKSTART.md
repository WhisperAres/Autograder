# Quick Start Guide - Autograder Multi-Role System

## 🚀 Quick Setup (2 minutes)

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```
✅ Backend runs on `http://localhost:5000`

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on `http://localhost:5174`

## 🔑 Test Credentials

### 👨‍🎓 Student Account
```
Email:    student@uni.edu
Password: password
```
**What you can do:**
- View assignments
- Upload code files
- See submissions history
- View test results and feedback

---

### 👨‍🏫 Grader Accounts
**Professor:**
```
Email:    prof@uni.edu
Password: password
```

**Lecturer:**
```
Email:    lecturer@uni.edu
Password: password
```

**Teaching Assistant:**
```
Email:    ta@uni.edu
Password: password
```

**What graders can do:**
- View all student submissions
- Review uploaded code
- Run test cases
- Provide feedback and marks
- Track grading progress

---

### ⚙️ Admin Account
```
Email:    admin@uni.edu
Password: password
```

**What admin can do:**
- Create and manage courses
- Enroll students
- Assign graders to courses
- View statistics
- Edit course details

---

## 🎯 Try It Out!

### Test Scenario 1: Upload as Student (5 minutes)
1. **Open** http://localhost:5174
2. **Login** with student@uni.edu / password
3. **Click** "Use this" button (quick login)
4. **View** the 3 assignments in the dashboard
5. **Click** on "Sum Function" assignment
6. **Upload** any .js file (or create one: `function sum(a,b) { return a+b; }`)
7. **See** it appear in submission history
8. **Click** "View Code" to see your upload

---

### Test Scenario 2: Grade as Grader (5 minutes)
1. **Open** http://localhost:5174
2. **Login** with prof@uni.edu / password
3. **See** all student submissions
4. **Click** a submission to select it
5. **View Code** tab to review code
6. **Click** "Run Test Cases" to execute tests
7. **Enter** marks (e.g., 85) and feedback
8. **Click** "Submit Feedback"

---

### Test Scenario 3: Manage Courses as Admin (5 minutes)
1. **Open** http://localhost:5174
2. **Login** with admin@uni.edu / password
3. **View** Dashboard with statistics
4. **Go to** Courses tab
5. **Create** new course:
   - Name: "Web Development"
   - Code: "CS301"
6. **Click** created course to open details
7. **Enroll** Student (ID: 1)
8. **Assign** Grader (ID: 101)

---

## 📱 Responsive Testing

Test on different devices:
- **Laptop**: Full 3-column layout
- **iPad**: 2-column layout
- **Phone**: Single column, optimized spacing

Browser DevTools: Press `F12` → Select device size

---

## 🔄 Key Features at a Glance

| Feature | Student | Grader | Admin |
|---------|---------|--------|-------|
| Login | ✅ | ✅ | ✅ |
| View Assignments | ✅ | - | - |
| Upload Files | ✅ | - | - |
| View Submissions | ✅ | ✅ | - |
| Review Code | ✅ | ✅ | - |
| Run Tests | - | ✅ | - |
| Provide Feedback | - | ✅ | - |
| Manage Courses | - | - | ✅ |
| Enroll Students | - | - | ✅ |
| Assign Graders | - | - | ✅ |

---

## 📋 What's Implemented

### Backend ✅
- Express.js server with CORS
- JWT authentication (1-day tokens)
- 3 roles: Student, Grader, Admin
- File upload with Multer (5MB)
- Test case simulation
- Course management
- Role-based access control

### Frontend ✅
- React Router role-based routing
- Responsive dark theme UI
- 5 responsive breakpoints (320px-1400px+)
- 3 role-specific dashboards
- Code viewer modal
- Real-time feedback forms
- Statistics dashboard

### Data Storage ✅
- In-memory JavaScript arrays
- Sample data pre-loaded
- Mock submissions visible
- Simulated test results

---

## 🔐 Authentication Flow

```
Login Page
    ↓
Email + Password
    ↓
JWT Token Created
    ↓
Redirect to Role Dashboard
    ↓
Student/Grader/Admin UI
```

---

## 📊 Sample Data Included

**Assignments:**
- Sum Function (Introductory)
- Fibonacci Sequence (Intermediate)
- Palindrome Checker (Intermediate)

**Students:**
- John Student (1)
- Alice Smith (2)
- Bob Johnson (3)

**Graders:**
- Dr. Professor (101)
- Ms. Lecturer (102)
- Mr. TA (103)

**Admin:**
- Admin User (201)

**Courses:**
- Introduction to Programming (CS101)
- Data Structures (CS201)

---

## 🚨 Common Issues

### Port Already in Use?
```bash
# Change backend port in src/server.js
# Or kill process: lsof -ti:5000 | xargs kill

# Frontend uses Vite config in vite.config.js
```

### Login Not Working?
- Check console (F12) for errors
- Verify both servers are running
- Clear localStorage: DevTools → Application → Storage → Clear All

### File Upload Not Working?
- Check file size (max 5MB)
- Ensure multer middleware is configured
- Check backend console for errors

---

## 📝 Next Steps

1. **Explore each dashboard** - Get familiar with UI
2. **Try all workflows** - Submit, grade, manage
3. **Check responsive design** - Test on mobile
4. **Review code** - See how roles work
5. **Read FEATURES.md** - Full feature list

---

## 💡 Tips

✅ Use quick-login buttons on login page  
✅ Test on multiple devices  
✅ Check console (F12) for debugging  
✅ Refresh page if stuck  
✅ Data resets when server restarts (in-memory)  

---

## 📞 Support

- Check [README.md](README.md) for full documentation
- See [FEATURES.md](FEATURES.md) for detailed features
- Review source code in `src/` directories

---

**Enjoy the Autograder! 🎓**
