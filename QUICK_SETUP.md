# Quick Commands Reference

## PostgreSQL Setup Commands

### Install PostgreSQL dependencies in backend:
```bash
cd G:\Autograder\backend
npm install pg sequelize dotenv
```

### Create .env file in backend folder with:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autograder_db
DB_USER=postgres
DB_PASSWORD=postgres
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

### Create database in PostgreSQL:
```bash
psql -U postgres
```

Then in psql:
```sql
CREATE DATABASE autograder_db;
\q
```

### Start the server:
```bash
cd G:\Autograder\backend
npm start
```

## PostgreSQL Commands

### Connect to database:
```bash
psql -U postgres -d autograder_db
```

### List all tables:
```sql
\dt
```

### Check code files:
```sql
SELECT id, fileName, fileSizeKB, uploadedAt FROM code_files LIMIT 10;
```

### Check submissions:
```sql
SELECT * FROM submissions;
```

### Check all files for a submission:
```sql
SELECT id, fileName, uploadedAt FROM code_files WHERE submissionId = 1;
```

### View file content:
```sql
SELECT fileContent FROM code_files WHERE id = 1;
```

### Delete all test data (careful!):
```sql
DELETE FROM code_files;
DELETE FROM submissions;
COMMIT;
```

## API Endpoints

### Upload File:
```
POST /submissions
- Requires: file (multipart) + assignmentId
- Stores file in database
```

### Get Student Submissions:
```
GET /submissions
- Returns: All submissions with file list
```

### View File Code:
```
GET /submissions/:submissionId/code/:fileId
- Fetches file content from database
- Returns: fileName + fileContent
```

### Delete File:
```
DELETE /submissions/:submissionId/file/:fileId
- Removes file from database
- Returns: Updated submission
```
