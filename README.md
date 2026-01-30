# Autograder - Multi-Role Student Submission Platform

A complete web-based autograder system with support for Students, Graders (Professors/Lecturers/TAs), and Admins. Built with Node.js/Express backend and React frontend.

## Features

### 🎓 Student Role
- Login with email and password
- View all available assignments
- Upload code solutions for assignments
- View submission history with timestamps
- See detailed feedback from graders
- View test results and marks
- Quick access to code viewer for submitted files

### 👨‍🏫 Grader Role
- View all student submissions
- Download and review student code
- Run automated test cases on submissions
- Provide detailed feedback on submissions
- Assign marks to submissions
- Track grading progress
- Filter submissions by assignment and student

### ⚙️ Admin Role
- Create and manage courses
- View course statistics and analytics
- Enroll students in courses
- Assign graders to courses
- View enrolled students for each course
- Manage course settings (name, code, semester, description)

## Project Structure

```
Autograder/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app configuration
│   │   ├── server.js              # Server startup
│   │   ├── auth/
│   │   │   ├── auth.controller.js       # Authentication logic with all users
│   │   │   ├── auth.routes.js           # Login endpoint
│   │   │   ├── assignments.controller.js
│   │   │   ├── assignments.routes.js
│   │   │   ├── submissions.controller.js
│   │   │   ├── submissions.routes.js
│   │   │   ├── grader.controller.js     # Grading endpoints
│   │   │   ├── grader.routes.js
│   │   │   ├── admin.controller.js      # Admin endpoints
│   │   │   └── admin.routes.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js   # (unused)
│   │   │   ├── verify.middleware.js  # JWT token verification
│   │   │   └── role.middleware.js    # Role-based access control
│   │   └── models/
│   │       ├── assignments.js       # Mock assignment data
│   │       ├── submissions.js       # Submission storage & methods
│   │       ├── grader.js           # Grader feedback & test results
│   │       └── admin.js            # Course & enrollment management
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main app with role-based routing
│   │   ├── App.css                 # Global styles + navbar
│   │   ├── pages/
│   │   │   ├── login.jsx           # Multi-role login page
│   │   │   ├── login.css
│   │   │   ├── dashboard.jsx       # Student dashboard
│   │   │   ├── dashboard.css
│   │   │   ├── grader.jsx          # Grader dashboard
│   │   │   ├── grader.css
│   │   │   ├── admin.jsx           # Admin dashboard
│   │   │   └── admin.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Test Credentials

### Student
- **Email:** student@uni.edu
- **Password:** password
- Additional students: alice@uni.edu, bob@uni.edu

### Graders
- **Professor:** prof@uni.edu / password
- **Lecturer:** lecturer@uni.edu / password
- **TA:** ta@uni.edu / password

### Admin
- **Email:** admin@uni.edu
- **Password:** password

## API Endpoints

### Authentication
- `POST /auth/login` - User login

### Assignments (Protected - All authenticated users)
- `GET /assignments` - Get all assignments
- `GET /assignments/:id` - Get assignment by ID

### Submissions (Protected - All authenticated users)
- `GET /submissions` - Get student's submissions
- `POST /submissions` - Upload new submission
- `GET /submissions/:id` - Get submission details
- `GET /submissions/:id/code` - Get submission code content
- `GET /submissions/:id/results` - Get test results

### Grader Routes (Protected - Grader role only)
- `GET /grader/submissions` - Get all submissions
- `GET /grader/submissions/:submissionId` - Get submission for grading
- `GET /grader/submissions/:submissionId/code` - Get code
- `POST /grader/submissions/:submissionId/run-tests` - Run test cases
- `POST /grader/submissions/:submissionId/feedback` - Provide feedback
- `PATCH /grader/submissions/:submissionId/status` - Update submission status

### Admin Routes (Protected - Admin role only)
- `GET /admin/courses` - List all courses
- `GET /admin/courses/:courseId` - Get course details
- `POST /admin/courses` - Create new course
- `PUT /admin/courses/:courseId` - Update course
- `DELETE /admin/courses/:courseId` - Delete course
- `GET /admin/courses/:courseId/students` - Get enrolled students
- `POST /admin/courses/:courseId/enroll` - Enroll student
- `GET /admin/courses/:courseId/graders` - Get assigned graders
- `POST /admin/courses/:courseId/assign-grader` - Assign grader
- `DELETE /admin/courses/:courseId/graders/:graderId` - Unassign grader
- `GET /admin/dashboard/stats` - Get dashboard statistics

## Setup & Installation

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5174`

## Technology Stack

### Backend
- Node.js
- Express.js
- Multer (file uploads)
- jsonwebtoken (JWT authentication)
- CORS enabled

### Frontend
- React 19.2.0
- React Router v7
- Axios (HTTP client)
- Pure CSS (no framework)
- Responsive design (320px to 1400px+)

## Key Features

✅ **Role-based Access Control** - Different dashboards for each role
✅ **JWT Authentication** - Secure token-based authentication
✅ **File Upload** - Students can upload code files
✅ **Code Viewing** - Graders and students can view submitted code
✅ **Test Execution** - Simulate test case running (grader feature)
✅ **Feedback System** - Graders can provide detailed feedback
✅ **Course Management** - Admins can manage courses and users
✅ **Responsive Design** - Works on all devices (mobile to desktop)
✅ **In-Memory Storage** - All data stored in JavaScript arrays (no database)
✅ **Real-time Updates** - No page reloads needed

## Database Notes

Currently uses **in-memory storage** with JavaScript arrays. All data is reset on server restart. To persist data:
1. Integrate MongoDB, PostgreSQL, or SQLite
2. Update models in `src/models/` to use database queries
3. Update controllers to use async database operations

## Responsive Breakpoints

- **Mobile (320-480px)** - Single column layout
- **Tablet Portrait (481-767px)** - Single column, adjusted spacing
- **Tablet Landscape (768-1023px)** - Two columns where applicable
- **Desktop (1024-1399px)** - Full three-column layout
- **Large Desktop (1400px+)** - Optimized full layout

## Future Enhancements

- [ ] Database integration for data persistence
- [ ] Actual code execution environment
- [ ] Plagiarism detection
- [ ] Email notifications
- [ ] Assignment deadline enforcement
- [ ] Grade statistics and analytics
- [ ] Batch student enrollment
- [ ] Code syntax highlighting
- [ ] Real-time collaboration features
- [ ] Mobile app version

## Security Notes

⚠️ **This is an MVP/Demo** - Not production-ready
- Passwords are stored in plain text (use bcrypt in production)
- Secret key should be environment variable
- CORS is open to all origins
- No rate limiting on endpoints
- No input validation/sanitization

## Error Handling

- Comprehensive error messages
- Console logging for debugging
- Try-catch blocks in all async operations
- User-friendly error displays

---

**Built with ❤️ as a complete multi-role autograder system**