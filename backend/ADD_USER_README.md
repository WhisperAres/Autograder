# User Management Script

This script allows you to easily add new users to the database with securely hashed passwords.

## Features

✅ **Secure Password Hashing** - Uses bcrypt with 10 salt rounds  
✅ **Two Modes** - Interactive or command-line arguments  
✅ **Duplicate Prevention** - Checks if email already exists  
✅ **Role Support** - student, ta, admin  
✅ **Database Integration** - Directly adds to PostgreSQL database  

## Setup

The script is already in your backend folder: `addUser.js`

## Usage

### Option 1: Interactive Mode (Easiest)

```bash
cd backend
node addUser.js
```

Then answer the prompts:
```
🔐 Add New User to Database

📧 Email address: student1@uni.edu
🔑 Password: mypassword123
👤 Role: student
📝 Full name (optional, press Enter to skip): John Doe
```

### Option 2: Command Line Arguments (Faster)

```bash
node addUser.js <email> <password> <role> [optional-name]
```

Examples:

```bash
# Add a student
node addUser.js student1@uni.edu password123 student "John Doe"

# Add a TA
node addUser.js ta1@uni.edu password456 ta "Jane Smith"

# Add an admin
node addUser.js admin2@uni.edu password789 admin "Admin User"

# Without name (uses email prefix)
node addUser.js student2@uni.edu password000 student
```

## Roles

- **student** - Can submit assignments, view grades
- **ta** - Can grade submissions, view all students
- **admin** - Full system control

## Password Requirements

- Minimum 6 characters
- Can contain any characters (letters, numbers, symbols)
- Stored as bcrypt hash in database (10 salt rounds)

## What Happens

1. ✅ Connects to PostgreSQL database
2. ✅ Validates email format
3. ✅ Checks if email already exists
4. ✅ Hashes password using bcrypt
5. ✅ Inserts user into `users` table
6. ✅ Shows success message with user details

## Example Output

```
✅ Database connection successful

⏳ Creating user...

✅ User created successfully!

📋 User Details:
   ID:    5
   Email: student1@uni.edu
   Name:  John Doe
   Role:  student

💡 This user can now login with:
   Email: student1@uni.edu
   Password: password123

✨ Password is securely hashed with bcrypt (10 salt rounds)
```

## Login with New Users

After creating a user, they can login with:

1. Go to http://localhost:5173 (or your frontend URL)
2. Enter email: `student1@uni.edu`
3. Enter password: `password123`

The backend will:
1. Query the database for the user by email
2. Compare the entered password with the bcrypt hash
3. If valid, issue a JWT token
4. User is logged in!

## Quick Reference Commands

```bash
# Add multiple students quickly
node addUser.js student1@uni.edu pass1 student "Student One"
node addUser.js student2@uni.edu pass2 student "Student Two"
node addUser.js student3@uni.edu pass3 student "Student Three"

# Add TAs
node addUser.js ta1@uni.edu tapass ta "TA One"

# Add another admin
node addUser.js admin2@uni.edu adminpass admin "Admin Two"
```

## Troubleshooting

**Error: "Email already exists"**
- That email is already in the database
- Use a different email

**Error: "Invalid role"**
- Role must be: `student`, `ta`, or `admin` (lowercase)

**Error: "Database connection Error"**
- Make sure PostgreSQL is running
- Check .env file for correct credentials
- Make sure you've run `node src/config/initDb.js` once

**Error: "Password must be at least 6 characters"**
- Make password longer (minimum 6 characters)

## Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds)
- Never stored in plain text in database
- Each password has a unique salt
- Impossible to reverse the hash
- Even if database is compromised, passwords are safe

## Admin User

To reset or check the admin user:

```bash
# Admin created during database init:
Email: admin@uni.edu
Password: admin123

# You can add another admin:
node addUser.js newadmin@uni.edu adminpass admin "New Admin"
```

## Integration with Login System

The auth system automatically:
1. ✅ Queries `users` table by email
2. ✅ Uses bcrypt to verify password
3. ✅ Issues JWT token if valid
4. ✅ All database-driven (no hardcoded users)

Everything is fully integrated and working! 🎉
