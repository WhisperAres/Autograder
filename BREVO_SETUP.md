# Brevo Email Provider Setup Guide

## Overview
The Autograder application has been migrated from SendGrid to **Brevo** (formerly Sendinblue) for email notifications.

---

## Code Changes Made

### 1. **Package Dependencies**
- **Removed**: `@sendgrid/mail` (v8.1.3)
- **No Additional Packages Needed**: Using Brevo's SMTP with existing Nodemailer dependency

**Action Required**: Run `npm install` in the `/backend` directory to clean up and update dependencies.

```bash
cd backend
npm install
```

### 2. **Email Service Implementation** (`backend/src/utils/email.js`)
- Replaced SendGrid SDK with Brevo SMTP relay using Nodemailer
- Configured Nodemailer to connect to Brevo's SMTP server (`smtp-relay.brevo.com` on port 587)
- Uses SMTP authentication with Brevo credentials

### 3. **Error Handling** (`backend/src/auth/invite.controller.js`)
- Updated error message to reference new environment variables
- Adjusted error parsing for Nodemailer/SMTP responses

### 4. **Documentation** (`README.md`)
- Updated technology stack to list Brevo instead of SendGrid
- Updated architecture diagram showing Brevo as email service

---

## Environment Variables Setup

Update your `.env` file with the following variables:

### **Required Variables** (for production)

```env
# Brevo SMTP Configuration
BREVO_SENDER_EMAIL=your-verified-sender@domain.com
BREVO_SMTP_KEY=your_brevo_smtp_password_here
EMAIL_USER=your-verified-sender@domain.com
```

### **Optional Variables**

```env
# Development/Testing
EMAIL_LOG_ONLY=true              # Set to 'true' to log emails instead of sending (dev mode)
NODE_ENV=development             # Set to 'production' to enable actual email sending
```

---

## Steps to Set Up Brevo

### 1. **Create a Brevo Account**
- Visit [https://www.brevo.com](https://www.brevo.com)
- Sign up for a free account
- Verify your email address

### 2. **Generate SMTP Credentials**
- Log in to Brevo Dashboard
- Navigate to **Settings → SMTP & API**
- In the **SMTP** section, you'll see:
  - **SMTP Server**: `smtp-relay.brevo.com`
  - **SMTP Port**: `587`
  - **SMTP Username**: Your sender email address
  - **SMTP Password**: Copy this password (this is your `BREVO_SMTP_KEY`)
- Add the SMTP password to your `.env` file as `BREVO_SMTP_KEY`

### 3. **Verify Sender Email**
- Go to **Senders** section in Brevo Dashboard
- Add your sender email address (the one you want to send from)
- Verify ownership by clicking the verification link in the email Brevo sends
- Add this verified email to `.env` as `BREVO_SENDER_EMAIL` and `EMAIL_USER`

### 4. **Monitor Email Activity (Optional)**
- Once configured, you can track email delivery in Brevo Dashboard under **Reports**
- View bounce rates, opens, clicks, etc.

---

## Testing Email Functionality

### Development Mode (No SMTP Key)
```env
EMAIL_LOG_ONLY=true
```
Emails will be logged to console instead of sent.

### Production Mode (With SMTP Key)
```env
NODE_ENV=production
BREVO_SENDER_EMAIL=verified-email@domain.com
BREVO_SMTP_KEY=your_actual_smtp_key
EMAIL_USER=verified-email@domain.com
```
Emails will be sent through Brevo SMTP relay.

### Test Endpoint
```bash
# To test student invite functionality
POST /api/admin/invite-students
Body: {
  "emails": ["test@example.com"],
  "courseId": 1
}
```

---

## Important Notes

1. **Free Plan Limits**: Brevo offers 300 emails/day on the free plan
2. **Sender Verification**: Only verified senders can send emails
3. **SMTP Port**: Uses port 587 (TLS, not SSL)
4. **Error Messages**: If authentication fails, check:
   - `BREVO_SMTP_KEY` is correct (copy the full SMTP password from Brevo, NOT the API key)
   - `BREVO_SENDER_EMAIL` is verified in Brevo dashboard
   - `EMAIL_USER` matches the sender email
   - Network connectivity to Brevo SMTP server

---

## Troubleshooting

### "Email provider unauthorized" Error
- Verify `BREVO_SMTP_KEY` in `.env` (make sure you copied the SMTP password, not API key)
- Check if sender email is verified in Brevo dashboard
- Ensure environment variables are loaded correctly

### "Invalid login credentials" or "Authentication failed"
- SMTP password may be incorrect - copy it again from Brevo dashboard
- Verify that SMTP is enabled in your Brevo account settings
- Double-check that you're using BREVO_SENDER_EMAIL as the username

### Emails Not Sending (Dev Mode)
- Check if `EMAIL_LOG_ONLY=true` - if so, emails are logged, not sent
- Set `NODE_ENV=production` for actual sending

### Connection Timeout
- Ensure you're using port 587 (already configured in code)
- Check firewall allows outgoing connections on port 587
- Verify SMTP server address is `smtp-relay.brevo.com`

---

## Quick Reference - Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `BREVO_SENDER_EMAIL` | Brevo Senders | Verified sender email address |
| `BREVO_SMTP_KEY` | Brevo SMTP & API Settings | SMTP password (NOT API key) |
| `EMAIL_USER` | Same as BREVO_SENDER_EMAIL | For backward compatibility |
| `EMAIL_LOG_ONLY` | Custom | Set to 'true' for dev mode |
| `NODE_ENV` | Custom | Set to 'production' to enable sending |

---

## Rollback to SendGrid (If Needed)

If you need to revert:
1. Restore the original SendGrid package in `package.json`
2. Restore original `email.js` implementation
3. Update environment variables back to `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

---

## Questions or Issues?
- Brevo Support: https://help.brevo.com
- Brevo SMTP Guide: https://help.brevo.com/hc/en-us/articles/209467485-Configure-SMTP
- Brevo API Docs: https://developers.brevo.com/docs
