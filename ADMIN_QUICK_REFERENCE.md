# Admin Dashboard - Quick Reference

## Access
- **URL**: Navigate to Admin panel after login (same dashboard as grader, but with admin role)
- **Required**: Admin role authentication
- **Note**: Both grader and admin use same test execution, but only admin can manage users and assignments

## Main Features

### 1. ASSIGNMENTS TAB

#### View Assignments
- Grid view of all assignments
- Shows title, description, due date, total marks
- Click card to select and view details

#### Create Assignment
1. Click "+ New Assignment" button
2. Fill in form:
   - Title (required)
   - Description (optional)
   - Due Date (required)
   - Total Marks (default: 100)
3. Click "Create Assignment"

#### Manage Assignment
Once selected, shows three tabs:

**📝 Submissions Tab**
- List of all student submissions for this assignment
- Shows: Student name, email, status, marks, submission date
- Click submission to view details
- Status colors: Blue (submitted), Green (evaluated)

**👀 Code Tab**
- View student code files
- Shows file name and content
- Run Tests button to execute test cases
- Test results show pass/fail for each test

**✏️ Edit Marks Tab**
- Update marks for selected submission
- Validates marks between 0 and totalMarks
- Click Save to update database

#### Delete Assignment
1. Click "🗑️ Delete" in assignment details
2. Confirm deletion
3. All related submissions and files are deleted

#### Download Marks
- Click "⬇️" button on assignment card
- Downloads CSV with all marks for that assignment

---

### 2. USERS TAB

#### View Users
Organized in two sections:
- **Students**: All student accounts
- **Graders**: All TA/grader accounts

Each user card shows:
- Name
- Email
- Role selector dropdown

#### Add User
1. Click "+ Add User" button
2. Fill in form:
   - Email (required, must be unique)
   - Name (required)
   - Role dropdown (student/ta/admin)
3. Click "Create User"
4. System shows temporary password to share with user
   - Default password: "TempPass123!"
   - User must change on first login

#### Change User Role
1. Find user in list
2. Click role dropdown
3. Select new role (student/ta/admin)
4. Changes save immediately to database

#### Roles Explained
- **student**: Can submit code for assignments
- **ta**: Can grade submissions, run tests, provide feedback
- **admin**: Full system access (this dashboard)

---

## Dashboard Statistics

Bottom section shows:
- 📚 Total Assignments
- 👥 Total Users
- 📝 Total Submissions
- ⏳ Pending Grading (submissions not yet graded)

---

## Workflow Examples

### Typical Admin Setup
1. Create 2-3 grader/TA accounts
2. Create 1-2 admin accounts (for backup)
3. Create assignments for the course
4. Monitor submissions and grading progress

### Grading Workflow
1. Select assignment from grid
2. Click on student submission
3. View their code in "Code" tab
4. Run tests to see results
5. Go to "Edit Marks" tab
6. Enter marks and save
7. Download CSV for final marks

### User Management Workflow
1. New student joins → Create account (student role)
2. Want to make student a grader? → Change role to "ta"
3. Need another admin? → Create with "admin" role
4. User joins as grader? → Create account with "ta" role

---

## API Endpoints (If Making Custom Requests)

### Users
```
GET    /admin/users                    → List all users
POST   /admin/users                    → Create user
GET    /admin/users/role/student       → Get all students
GET    /admin/users/role/ta            → Get all graders
PATCH  /admin/users/:userId/role       → Change user role
```

### Assignments
```
GET    /admin/assignments              → List all assignments
POST   /admin/assignments              → Create assignment
PATCH  /admin/assignments/:id          → Edit assignment
DELETE /admin/assignments/:id          → Delete assignment
```

### Submissions & Grading
```
GET    /admin/submissions              → All submissions
GET    /admin/submissions/assignment/:id → Submissions for assignment
PATCH  /admin/submissions/:id/marks    → Update marks
POST   /admin/submissions/:id/run-tests → Run test cases
```

### Reports
```
GET    /admin/assignments/:id/marks-report  → Marks report
GET    /admin/assignments/:id/export-csv    → Download CSV
GET    /admin/stats                         → Dashboard stats
```

---

## CSV Export Format

When downloading marks, file includes:
```
Student ID, Student Name, Email, Marks, Total Marks, Percentage, Status, Submitted At
1, Alice Smith, alice@example.com, 85, 100, 85.00%, graded, 2024-01-15 10:30:00
2, Bob Johnson, bob@example.com, 92, 100, 92.00%, graded, 2024-01-15 10:45:00
```

---

## Tips & Tricks

### Marks Editing
- Can edit marks anytime, even after student submitted
- Doesn't re-run tests, just updates the database value
- Useful for manual grading adjustments

### Test Running
- Tests use code files from student submission
- Shows actual output vs expected output
- Error messages help debug code issues

### User Creation
- Email must be unique
- Temporary password is "TempPass123!"
- Make sure to share password securely
- User should change password on login

### Bulk Operations
- Delete assignment deletes all submissions for it
- Changing multiple users? Use dropdown on each card
- Download CSV for backup/spreadsheet analysis

### Common Issues
- "Failed to create assignment" → Check title/due date
- "Email already exists" → User already in system
- "Marks must be between 0 and X" → Check totalMarks value
- "No test cases" → Create test cases first (if needed)

---

## Integration with Other Dashboards

Admin dashboard shares:
- **Submissions** with grader (grader can grade, admin can also edit marks)
- **Test execution** with grader (same test running capability)
- **Assignments** with students (students see same assignments)
- **Database** with entire system (all data persistent)

Unique to Admin:
- User management
- Assignment CRUD (create/edit/delete)
- Direct marks editing
- System statistics
- CSV reports

---

## Support & Troubleshooting

### Check what's happening
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API responses
4. Verify token is in localStorage

### Common Problems
- **Can't access admin panel**: Check if user has admin role
- **Assignments not showing**: Verify database connection
- **Tests fail silently**: Check test case creation
- **Marks not updating**: Check totalMarks validation

### Performance
- Dashboard loads stats + assignments + users + submissions
- First load may take 1-2 seconds
- Subsequent operations are fast
- CSV export is instant (client-side)

---

## Security Notes

✅ **Protected**:
- All routes require JWT token
- Admin role required for all operations
- Passwords hashed with bcrypt
- Email uniqueness enforced

⚠️ **Remember**:
- Share temporary passwords securely
- Don't expose API endpoints publicly
- Keep auth tokens confidential
- Review user access regularly

---

Last Updated: 2024
Version: 1.0 - Complete Admin Dashboard Implementation
