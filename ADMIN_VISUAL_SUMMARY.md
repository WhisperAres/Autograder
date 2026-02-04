# ADMIN DASHBOARD - VISUAL SUMMARY

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Admin Dashboard Component                     │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐                    │    │
│  │  │ Assignments  │  │    Users     │  ← Tabs            │    │
│  │  └──────────────┘  └──────────────┘                    │    │
│  │        │                   │                            │    │
│  │        ├─► Assignment Grid │                            │    │
│  │        ├─► Create Form    │                            │    │
│  │        ├─► Details Panel  │                            │    │
│  │        │   ├─ Submissions │                            │    │
│  │        │   ├─ Code Viewer │                            │    │
│  │        │   └─ Marks Edit  │                            │    │
│  │        │                   ├─► User List (Students)   │    │
│  │        │                   ├─► User List (Graders)    │    │
│  │        │                   └─► Add User Form          │    │
│  │        │                                               │    │
│  │        └─► Dashboard Stats (Cards)                    │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
            │                          │
            │ HTTP Requests            │ HTTP Responses
            │ (JSON + JWT Token)       │ (JSON Data)
            ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Admin Routes (Protected)                    │   │
│  │                                                           │   │
│  │  POST   /admin/users         ◄─ Create User             │   │
│  │  GET    /admin/users         ◄─ List Users              │   │
│  │  PATCH  /admin/users/:id     ◄─ Update Role             │   │
│  │                                                           │   │
│  │  POST   /admin/assignments   ◄─ Create Assignment        │   │
│  │  GET    /admin/assignments   ◄─ List Assignments         │   │
│  │  PATCH  /admin/assignments/:id                           │   │
│  │  DELETE /admin/assignments/:id                           │   │
│  │                                                           │   │
│  │  GET    /admin/submissions                               │   │
│  │  PATCH  /admin/submissions/:id/marks                     │   │
│  │  POST   /admin/submissions/:id/run-tests                 │   │
│  │                                                           │   │
│  │  GET    /admin/assignments/:id/export-csv               │   │
│  │  GET    /admin/stats                                     │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Admin Controller Functions                  │   │
│  │                                                           │   │
│  │  Users:        getAllUsers, createUser,                 │   │
│  │                updateUserRole, getUsersByRole            │   │
│  │                                                           │   │
│  │  Assignments:  getAssignments, createAssignment,        │   │
│  │                updateAssignment, deleteAssignment        │   │
│  │                                                           │   │
│  │  Grading:      getSubmissionsByAssignment,              │   │
│  │                updateSubmissionMarks, runTestCases       │   │
│  │                                                           │   │
│  │  Reports:      getMarksReport, downloadMarksCSV,        │   │
│  │                getDashboardStats                         │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
            │
            │ Sequelize ORM
            │ (Database Queries)
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
│                                                                   │
│  ┌──────────┬────────────────┬──────────────┐                  │
│  │  Users   │  Assignments   │ Submissions  │                  │
│  │          │                │              │                  │
│  │ id       │ id             │ id           │                  │
│  │ email    │ title          │ assignmentId │                  │
│  │ name     │ description    │ studentId    │                  │
│  │ password │ dueDate        │ marks        │                  │
│  │ role     │ totalMarks     │ status       │                  │
│  └──────────┴────────────────┴──────────────┘                  │
│                                                                   │
│  ┌──────────────┬──────────────┬──────────────┐               │
│  │ CodeFiles    │ TestCases    │ TestResults  │               │
│  │              │              │              │               │
│  │ id           │ id           │ id           │               │
│  │ submissionId │ assignmentId │ submissionId │               │
│  │ fileName     │ testName     │ testCaseId   │               │
│  │ fileContent  │ input        │ passed       │               │
│  │              │ expectedOut  │ actualOutput │               │
│  └──────────────┴──────────────┴──────────────┘               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Interface Layouts

### Assignment Management Tab

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
│        📚 Assignments   👥 Users                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Assignments                              [+ New Assignment]  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Lab 1: Arrays   │  │ Lab 2: Sorting  │  │ Lab 3: DP  │  │
│  │ Description...  │  │ Description...  │  │ Desc...    │  │
│  │ 📌 100 marks    │  │ 📌 100 marks    │  │ 📌 50 m..  │  │
│  │ 📅 Jan 15       │  │ 📅 Jan 22       │  │ 📅 Feb 5   │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
│                                                              │
│  [Selected Assignment Details]                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Lab 1: Arrays                                  [🗑️]  │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ 📝 Submissions | 👀 Code | ✏️ Edit Marks      │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ Submissions Tab:                                       │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ Alice Smith (alice@...) ✅ 85/100   Jan 15      │ │  │
│  │ │ Bob Johnson (bob@...)   ✅ 92/100   Jan 16      │ │  │
│  │ │ Carol Davis (carol@...) ⏳ 0/100    not graded  │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### User Management Tab

```
┌─────────────────────────────────────────────────────────────┐
│ User Management                            [+ Add User]      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👨‍🎓 Students (8)                                       │  │
│  │                                                        │  │
│  │ Alice Smith              │ [Dropdown: student ▼]     │  │
│  │ alice@school.edu         │ Change role: ta, admin     │  │
│  │                                                        │  │
│  │ Bob Johnson              │ [Dropdown: student ▼]     │  │
│  │ bob@school.edu           │ Change role: ta, admin     │  │
│  │                                                        │  │
│  │ Carol Davis              │ [Dropdown: student ▼]     │  │
│  │ carol@school.edu         │ Change role: ta, admin     │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👨‍🏫 Graders (3)                                         │  │
│  │                                                        │  │
│  │ Dr. Smith (prof@...)     │ [Dropdown: ta ▼]         │  │
│  │ Change role: student, admin                          │  │
│  │                                                        │  │
│  │ Ms. Johnson (ta@...)     │ [Dropdown: ta ▼]         │  │
│  │ Change role: student, admin                          │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Dashboard Stats:                                            │
│  [📚 15 Assignments] [👥 11 Users] [📝 120 Submissions]    │
│  [⏳ 25 Pending Grading]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Hierarchy

```
Admin Dashboard (Root)
│
├─ Assignments Tab (activeTab = "assignments")
│  │
│  ├─ Assignment Grid (if !selectedAssignment)
│  │  ├─ Create Form (toggle visible)
│  │  └─ Assignment Cards (grid layout)
│  │     └─ Card click → selectAssignment
│  │
│  └─ Assignment Details (if selectedAssignment)
│     │
│     ├─ Header with Back button
│     ├─ Delete button (cascade delete)
│     │
│     └─ Details Tabs (detailsTab)
│        │
│        ├─ Submissions Tab
│        │  ├─ Submission List
│        │  │  ├─ Submission Click → selectSubmission
│        │  │  └─ Shows: Name, Email, Status, Marks, Date
│        │  │
│        │  └─ Submission Details (if selectedSubmission)
│        │     ├─ View Code button
│        │     ├─ Run Tests button
│        │     └─ Edit Marks button
│        │
│        ├─ Code Tab (if selectedSubmission)
│        │  ├─ Code File 1
│        │  │  ├─ File name
│        │  │  └─ File content (pre/code)
│        │  ├─ Code File 2
│        │  │  ├─ File name
│        │  │  └─ File content
│        │  └─ Run Tests button
│        │     └─ Test Results (if testResults)
│        │
│        └─ Edit Marks Tab (if selectedSubmission)
│           ├─ Student Name
│           ├─ Marks Input Field
│           ├─ Max Marks Display
│           └─ Save Button
│
├─ Users Tab (activeTab = "users")
│  │
│  ├─ Add User Form (toggle visible)
│  │  ├─ Email input
│  │  ├─ Name input
│  │  ├─ Role dropdown
│  │  └─ Create button
│  │
│  └─ Users Grid
│     ├─ Students Section
│     │  ├─ User Card 1
│     │  │  ├─ Name
│     │  │  ├─ Email
│     │  │  └─ Role Dropdown
│     │  ├─ User Card 2
│     │  └─ ...
│     │
│     └─ Graders Section
│        ├─ User Card 1
│        ├─ User Card 2
│        └─ ...
│
└─ Dashboard Stats (always visible at bottom)
   ├─ Total Assignments
   ├─ Total Users
   ├─ Total Submissions
   └─ Pending Grading
```

---

## Data Flow Diagrams

### Creating an Assignment

```
Admin Input
   │
   ├─ Title: "Lab 1"
   ├─ Description: "Arrays"
   ├─ Due Date: 2024-01-15
   └─ Total Marks: 100
        │
        ▼
   Form Validation
   │
   ├─ Title required? ✓
   ├─ Due Date required? ✓
   └─ Valid data? ✓
        │
        ▼
   API Call
   │
   └─ POST /admin/assignments
      │
      ├─ Headers: Authorization + JWT
      ├─ Body: JSON assignment data
      │
      └─ Backend Controller
         │
         ├─ Create Sequelize assignment
         ├─ Save to database
         └─ Return created object
         │
         ▼
   Response: {id: 1, title: "Lab 1", ...}
   │
   ├─ Update assignments array
   ├─ Clear form
   ├─ Close form panel
   └─ Show success message
   │
   ▼
UI Updated
   │
   └─ New card appears in grid
```

### Grading a Submission

```
Admin Workflow
   │
   ├─ Select Assignment from grid
   │  │
   │  └─ Load Submissions for assignment
   │     │
   │     └─ GET /admin/submissions/assignment/:id
   │
   ├─ Click Submission in list
   │  │
   │  └─ Display submission details
   │
   ├─ Click "View Code" in Code Tab
   │  │
   │  └─ Display code files
   │
   ├─ Click "Run Tests" button
   │  │
   │  └─ POST /admin/submissions/:id/run-tests
   │     │
   │     └─ Backend executes tests
   │        ├─ Create temp directory
   │        ├─ Write code files
   │        ├─ Compile/run code
   │        ├─ Capture output
   │        ├─ Compare to expected
   │        └─ Create TestResult records
   │
   ├─ View Test Results
   │  │
   │  ├─ Test 1: ✅ PASSED
   │  ├─ Test 2: ✅ PASSED
   │  ├─ Test 3: ❌ FAILED
   │  └─ Error message (if failed)
   │
   ├─ Go to "Edit Marks" Tab
   │  │
   │  └─ Enter marks (e.g., 85)
   │
   └─ Click "Save" button
      │
      └─ PATCH /admin/submissions/:id/marks
         │
         └─ Backend updates marks
            ├─ Validate range (0-100)
            ├─ Update database
            └─ Return success
      │
      ▼
   Marks Updated
   │
   └─ Submission shows new marks
```

### Exporting Marks

```
Admin clicks Download button
   │
   ├─ On assignment card (📥)
   │
   └─ GET /admin/assignments/:id/export-csv
      │
      ├─ Headers: Authorization + JWT
      │
      └─ Backend processing
         │
         ├─ Query submissions for assignment
         ├─ Include student data
         ├─ Format as CSV:
         │  │
         │  ├─ Headers row
         │  │  │
         │  │  └─ Student ID, Name, Email, Marks, Total, %, Status, Date
         │  │
         │  ├─ Data rows
         │  │  │
         │  │  ├─ 1, Alice Smith, alice@..., 85, 100, 85.00%, graded, 2024-01-15...
         │  │  ├─ 2, Bob Johnson, bob@..., 92, 100, 92.00%, graded, 2024-01-16...
         │  │  └─ 3, Carol Davis, carol@..., 0, 100, 0.00%, submitted, ...
         │  │
         │  └─ Set HTTP headers
         │     │
         │     ├─ Content-Type: text/csv
         │     └─ Content-Disposition: attachment; filename="marks_..."
         │
         └─ Response: CSV file content
            │
            ▼
      Browser downloads file
            │
            └─ File saved to: ~/Downloads/marks_1_1705326000000.csv
```

---

## State Management Overview

```javascript
Component State Structure:

AdminDashboard {
  // Data
  stats: {totalUsers, totalAssignments, ...}
  assignments: [{id, title, dueDate, ...}, ...]
  users: [{id, email, name, role}, ...]
  submissions: [{id, assignmentId, studentId, ...}, ...]
  
  // UI Navigation
  activeTab: "assignments" | "users"
  selectedAssignment: Assignment | null
  selectedSubmission: Submission | null
  detailsTab: "submissions" | "code" | "marks"
  
  // Form Inputs
  newAssignment: {title, description, dueDate, totalMarks}
  newUser: {email, name, role}
  submissionMarks: string (number input)
  
  // Results Display
  testResults: [{testName, passed, ...}, ...] | null
  
  // Status
  loading: boolean
  error: string
}
```

---

## API Request/Response Examples

### Create Assignment

**Request**:
```http
POST /admin/assignments HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "Lab 1: Arrays",
  "description": "Learn array operations",
  "dueDate": "2024-01-15T23:59:00Z",
  "totalMarks": 100
}
```

**Response**:
```json
{
  "message": "Assignment created successfully",
  "assignment": {
    "id": 1,
    "title": "Lab 1: Arrays",
    "description": "Learn array operations",
    "dueDate": "2024-01-15T23:59:00.000Z",
    "totalMarks": 100,
    "createdAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### Update Marks

**Request**:
```http
PATCH /admin/submissions/42/marks HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "marks": 85
}
```

**Response**:
```json
{
  "message": "Marks updated successfully",
  "submission": {
    "id": 42,
    "assignmentId": 1,
    "studentId": 5,
    "marks": 85,
    "totalMarks": 100,
    "status": "graded"
  }
}
```

### Export CSV

**Request**:
```http
GET /admin/assignments/1/export-csv HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="marks_1_1705326000000.csv"

Student ID,Student Name,Email,Marks,Total Marks,Percentage,Status,Submitted At
1,"Alice Smith","alice@school.edu",85,100,85.00%,graded,"2024-01-15 10:30:00"
2,"Bob Johnson","bob@school.edu",92,100,92.00%,graded,"2024-01-15 10:45:00"
3,"Carol Davis","carol@school.edu",0,100,0.00%,submitted,"not graded"
```

---

## Responsive Design Breakpoints

```
Desktop (1024px+)
├─ Header: Full width with gradient
├─ Tabs: Centered, side by side
├─ Assignment Grid: 3-4 columns
├─ User Cards: 2 columns per section
└─ Submission List: Full width

Tablet (768px)
├─ Header: Full width, slightly smaller
├─ Tabs: Centered, responsive
├─ Assignment Grid: 2 columns
├─ User Cards: 1 column per section
└─ Submission List: Full width

Mobile (480px)
├─ Header: Full width, minimal padding
├─ Tabs: Single column buttons
├─ Assignment Grid: 1 column (stacked)
├─ User Cards: Single layout
├─ Forms: Full width inputs
└─ All buttons: Full width
```

---

## Color Scheme

```
Primary Green:    #10b981  (main accent color)
Dark Green:       #059669  (hover state)
Light Green:      #6ee7b7  (text highlight)

Dark BG:          #111827  (main background)
Secondary:        #1f2937  (cards)
Tertiary:         #374151  (input backgrounds)

Text Primary:     #ffffff  (main text)
Text Secondary:   #d1d5db  (secondary text)
Text Muted:       #9ca3af  (disabled/muted)

Borders:          #4b5563  (dividers, borders)
Danger:           #ef4444  (delete button)

Status Colors:
  ├─ Submitted:   #3b82f6 (blue)
  ├─ Evaluated:   #10b981 (green)
  ├─ Graded:      #22c55e (lighter green)
  └─ Failed:      #ef4444 (red)
```

---

**Diagram Generation Complete**

All visual representations of the Admin Dashboard system have been created. This provides a complete understanding of the architecture, UI flow, data structures, and visual design.

For more details, refer to the comprehensive documentation files.
