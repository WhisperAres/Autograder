# Supabase Database Setup Guide

## Overview

This guide walks through setting up a PostgreSQL database on Supabase for the Autograder application. Supabase provides a free PostgreSQL database instance with automatic backups and SSL connections.

---

## Prerequisites

- Supabase account (free tier is sufficient for development/testing)
- Node.js and npm installed
- Git for cloning the repository

---

## Complete Setup Steps

### 1. Create a Supabase Account

- Visit https://supabase.com
- Click **"Sign Up"** or **"Start Your Project"**
- Choose **"Sign up with email"** or use GitHub/Google authentication
- Verify your email address
- Complete the account setup

### 2. Create a New Project

- After logging in, click **"New Project"** or **"Create a new project"**
- Fill in the project details:
  - **Project Name**: e.g., "Autograder"
  - **Database Password**: Create a strong password (save this securely!)
  - **Region**: Select the region closest to your deployment location (e.g., `us-east-1`, `eu-west-1`)
- Click **"Create new project"**
- Wait for the project to initialize (2-3 minutes)

### 3. Get Your Database Connection String

Once the project is ready:

1. Go to **Settings** → **Database** (in the left sidebar)
2. Copy the **Connection String** under "Connection pooling" or "Direct connection"
3. The URL format should look like:
   ```
   postgresql://postgres.xxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
4. Save this as your `DATABASE_URL` for environment variables

### 4. Configure Firewall & Network Access

By default, Supabase allows connections from anywhere. For security in production:

1. Go to **Settings** → **Network** (in the left sidebar)
2. Under **Firewall rules**, add your backend server's IP address (if deploying on Render or similar)
   - For Render: Add `0.0.0.0/0` (Render uses dynamic IPs) or check Render documentation for static IPs
3. Keep localhost unrestricted for local development

### 5. Initialize the Database Schema

The Autograder app uses Sequelize ORM to automatically create tables. To initialize the schema:

1. **Set up local environment variables** (for local testing):
   ```bash
   # backend/.env
   DATABASE_URL=postgresql://postgres.xxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   NODE_ENV=development
   JWT_SECRET=your_secret_key_here
   ```

2. **Run the initialization script**:
   ```bash
   cd backend
   npm install
   node src/config/initDb.js
   ```

   This script:
   - Connects to Supabase
   - Creates all required tables (users, courses, assignments, submissions, etc.)
   - Sets up relationships and constraints

3. **Verify tables were created**:
   - Go to Supabase dashboard
   - Click **"SQL Editor"** (or **"Tables"** in the sidebar)
   - Confirm you see tables like `users`, `courses`, `assignments`, `submissions`, etc.

### 6. Enable SSL for Production

Supabase requires SSL for secure connections in production:

1. Go to **Settings** → **Database** 
2. Under "Connection String", select **"SSL connection"** (if using `sslmode=require`)
3. The backend code already handles SSL (see `backend/src/config/database.js`)
4. Test the connection with:
   ```bash
   node -e "require('./src/config/database.js')"
   # Should output: ✅ PostgreSQL Connected Successfully
   ```

### 7. Create a Database User (Optional but Recommended)

For better security in production, create a separate database user instead of using the default `postgres` user:

1. Go to **SQL Editor** in Supabase dashboard
2. Run this query:
   ```sql
   CREATE ROLE autograder_app WITH LOGIN PASSWORD 'your_strong_password';
   GRANT CONNECT ON DATABASE postgres TO autograder_app;
   GRANT USAGE ON SCHEMA public TO autograder_app;
   GRANT CREATE ON SCHEMA public TO autograder_app;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autograder_app;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autograder_app;
   ```
3. Update `DATABASE_URL` to use this user:
   ```
   postgresql://autograder_app:your_strong_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

### 8. Backup and Recovery

Supabase automatically backs up your database daily. To restore:

1. Go to **Settings** → **Backups**
2. View available backups and restore options
3. For manual exports, use **SQL Editor** → **Export** or use `pg_dump` command

---

## Environment Variables for Supabase

Add these to your `.env` file (backend):

```env
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres.xxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
NODE_ENV=production

# Other required vars
JWT_SECRET=your_strong_random_secret_here
REFRESH_SECRET=another_strong_random_secret_here

# Brevo Email Config (required for email features)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Autograder

# Render Deployment (if deploying on Render)
PORT=5000
```

---

## Testing the Connection

To verify Supabase is properly configured:

```bash
cd backend

# Test 1: Check if connection works
node -e "require('dotenv').config(); const db = require('./src/config/database'); db.authenticate().then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message))"

# Test 2: Run the init script
node src/config/initDb.js

# Test 3: List all tables
node -e "
  require('dotenv').config();
  const { sequelize } = require('sequelize');
  const db = require('./src/config/database');
  db.showAllSchemas({ logging: false }).then(schemas => console.log('Tables:', schemas));
"
```

---

## Common Issues & Troubleshooting

### "Connection refused" or "Cannot reach database"
- Verify `DATABASE_URL` is correct
- Check that Supabase project status is "Active" (not initializing)
- Ensure firewall rules allow your IP address
- Test with `psql` command-line tool:
  ```bash
  psql "postgresql://postgres:password@host:port/postgres"
  ```

### "Password authentication failed"
- Double-check the password in `DATABASE_URL` matches your Supabase project password
- Passwords with special characters should be URL-encoded (e.g., `@` → `%40`)
- Reset the database password in Supabase **Settings** → **Database** if needed

### "SSL connection required"
- Add `sslmode=require` to your connection string:
  ```
  postgresql://user:password@host:port/postgres?sslmode=require
  ```
- The code already handles this (see `database.js`)

### Tables not created after running `initDb.js`
- Check that `NODE_ENV` is not `production` (Sequelize won't auto-create tables in production)
- Run with logging enabled:
  ```bash
  node -e "process.env.DEBUG='sequelize:*'; require('./src/config/initDb.js')"
  ```
- Verify user permissions (run the "Create Database User" step above)

### Slow queries or timeouts
- Upgrade from free tier to paid plan for better performance
- Add database indexes for frequently queried columns
- Implement connection pooling (already configured in `database.js`)

---

## Production Deployment Checklist

- [ ] Database URL uses strong password
- [ ] SSL is enabled (`sslmode=require`)
- [ ] Firewall rules restrict access to trusted IPs only
- [ ] Separate database user created (not `postgres`)
- [ ] Backups are enabled and tested
- [ ] Connection pooling is configured
- [ ] Environment variables are set in Render/deployment platform
- [ ] Database connection tested before deploying app
- [ ] Monitoring/alerting configured (optional)

---

## Supabase Management

### Monitor Database Activity

- Go to **Logs** in Supabase dashboard to view recent queries
- Check **Database** → **Postgres** for connection statistics
- Use **Reports** for performance metrics

### Upgrade Database

- Go to **Settings** → **Billing**
- Upgrade from free plan to paid for more storage/performance
- Free tier includes:
  - 500 MB database storage
  - 2 GB bandwidth/month
  - 1 GB file storage

### Reset or Delete Database

- Go to **Settings** → **Database** → **Danger Zone**
- Click **"Reset Database"** to delete all data and restart
- Or delete the entire project under **Settings** → **General** → **Delete Project**

---

## Additional Resources

- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Sequelize ORM Docs: https://sequelize.org/
- Connection Pooling Guide: https://supabase.com/docs/guides/database/connecting-to-postgres

---

## Questions?

- Check Supabase Support: https://supabase.com/support
- Review Autograder's `backend/src/config/database.js` for connection configuration
- Test locally before deploying to production
