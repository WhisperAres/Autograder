# Issues Fixed and Remaining Actions

## ✅ Issues Fixed

### 1. **StudentInvite Column Error** ✨
**Problem**: Error `column "createdBy" does not exist` when deleting users
**Fix**: Updated `admin.controller.js` deleteUser function to:
- Remove the non-existent `createdBy` field query
- Just skip the student invites cleanup with a warning
- StudentInvite model only has: id, email, courseId, token, expiresAt, used, usedAt, createdAt

**File**: `vsls:/backend/src/auth/admin.controller.js` (deleteUser function)

---

### 2. **All Users Added to Legacy Course** ✨
**Problem**: No students/graders visible on admin page for legacy course
**Root Cause**: Users must be in `course_users` table for their specific course to appear in admin

**Fixes Made**:
1. **Updated `server.js`** - Enhanced `ensureLegacyCourseMapping()`:
   - Now runs regardless of whether there are legacy assignments
   - Adds ALL users (except admin) as students to the legacy course
   - Runs on every server startup to ensure all users are included

2. **Created manual script** - `add-users-to-legacy-course.js`:
   ```bash
   cd backend
   node add-users-to-legacy-course.js
   ```
   This will:
   - Find the legacy course
   - Add any missing users as students
   - Show a summary of changes

**Run the script to immediately fix visibility:**
```bash
cd backend && node add-users-to-legacy-course.js
```

---

## ⚠️ Remaining Issues

### 3. **SMTP Connection Timeout** 🔴
**Problem**: 
```
Brevo SMTP error: Error: Connection timeout
code: 'ETIMEDOUT'
```

**Causes**:
1. **Network/Firewall**: Port 587 might be blocked by your hosting environment
2. **Wrong Credentials**: `BREVO_SMTP_KEY` or `BREVO_SENDER_EMAIL` incorrect
3. **DNS Issues**: Can't resolve `smtp-relay.brevo.com`

**Solutions** (in order of likelihood):

#### A. **Enable Dev Mode (Quickest Fix)** ⭐
```env
# In .env
EMAIL_LOG_ONLY=true
NODE_ENV=development
```
This logs emails to console instead of sending, perfect for testing.

#### B. **Verify Environment Variables**
```env
BREVO_SENDER_EMAIL=your-verified-email@domain.com
BREVO_SMTP_KEY=your_brevo_smtp_password_here
EMAIL_USER=your-verified-email@domain.com
```

Key points:
- `BREVO_SMTP_KEY` is the SMTP password, NOT the API key
- Email must be verified in Brevo dashboard
- Copy credentials exactly from Brevo dashboard

#### C. **Test Brevo Connectivity**
If you have access to terminal in the container:
```bash
telnet smtp-relay.brevo.com 587
```
If it times out, your hosting environment blocks outgoing SMTP.

#### D. **Alternative: Use Local SMTP or API**
If outbound SMTP is blocked:
1. Use Brevo's REST API instead (would need code changes)
2. Use SendGrid (switch back)
3. Use your server's local mail (sendmail/postfix)
4. Contact your hosting provider to whitelist port 587

---

## 📋 What to Do Now

1. **Immediately**: Run the user script to populate legacy course
   ```bash
   cd backend
   node add-users-to-legacy-course.js
   ```

2. **For Testing**: Enable dev mode in `.env`
   ```env
   EMAIL_LOG_ONLY=true
   ```

3. **For Production**: 
   - Verify Brevo credentials are correct
   - Contact hosting provider if port 587 is blocked
   - Check Brevo dashboard for verified senders

4. **Restart Server**: After making changes
   ```bash
   npm start
   ```

---

## 🧪 Testing Admin Page

After running the script, test the admin page:

```bash
# Test endpoint to get students in legacy course
GET /api/admin/users/role/student?courseId=1

# Should return all users as students
```

---

## 📝 Files Modified

1. `vsls:/backend/src/auth/admin.controller.js` - Fixed deleteUser function
2. `vsls:/backend/src/server.js` - Enhanced legacy course migration
3. `vsls:/backend/add-users-to-legacy-course.js` - New utility script
