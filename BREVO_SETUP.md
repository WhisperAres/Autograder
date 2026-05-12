# Brevo Email Provider Setup Guide

## Overview
The Autograder application has been migrated from SendGrid to **Brevo** (formerly Sendinblue) for email notifications.

---

## Code Changes Made

### 1. **Package Dependencies**
- **Removed**: `@sendgrid/mail` (v8.1.3)
- **Added**: `brevo` (v1.0.0)

**Action Required**: Run `npm install` in the `/backend` directory to install the new dependency.

```bash
cd backend
npm install
```

### 2. **Email Service Implementation** (`backend/src/utils/email.js`)
- Replaced SendGrid SDK with Brevo's official SDK
- Updated email sending logic to use Brevo's Transactional Email API
- Changed error handling for Brevo-specific response formats

### 3. **Error Handling** (`backend/src/auth/invite.controller.js`)
- Updated error message to reference new environment variables
- Adjusted error parsing for Brevo API responses

### 4. **Documentation** (`README.md`)
- Updated technology stack to list Brevo instead of SendGrid
- Updated architecture diagram showing Brevo as email service

---

## Environment Variables Setup

Update your `.env` file with the following variables:

### **Required Variables** (for production)

```env
# Brevo Email Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your-verified-sender@domain.com
BREVO_SENDER_NAME=Autograder
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

### 2. **Generate API Key**
- Log in to Brevo Dashboard
- Navigate to **Settings → SMTP & API**
- Click on **API Keys** tab
- Create a new API key (or use existing one)
- Copy the **API v3 Key** (not the SMTP key)
- Add it to your `.env` file as `BREVO_API_KEY`

### 3. **Verify Sender Email**
- Go to **Senders** section in Brevo Dashboard
- Add your sender email address (the one you want to send from)
- Verify ownership by clicking the verification link in the email Brevo sends
- Add this verified email to `.env` as `BREVO_SENDER_EMAIL`
- Optionally add sender name as `BREVO_SENDER_NAME`

### 4. **Configure Email Templates (Optional)**
- Brevo allows you to create email templates for better formatting
- You can create templates in Brevo dashboard and reference them via template ID
- Current implementation sends raw HTML/text (no templates required)

### 5. **Monitor Email Activity**
- Once configured, you can track email delivery in Brevo Dashboard under **Reports**
- View bounce rates, opens, clicks, etc.

---

## Testing Email Functionality

### Development Mode (No API Key)
```env
EMAIL_LOG_ONLY=true
```
Emails will be logged to console instead of sent.

### Production Mode (With API Key)
```env
NODE_ENV=production
BREVO_API_KEY=your_actual_api_key
BREVO_SENDER_EMAIL=verified-email@domain.com
```
Emails will be sent through Brevo.

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
3. **API Rate Limits**: Check Brevo documentation for rate limits on your plan
4. **Error Messages**: If authentication fails, check:
   - `BREVO_API_KEY` is correct and active
   - `BREVO_SENDER_EMAIL` is verified in Brevo dashboard
   - Network connectivity to Brevo API

---

## Troubleshooting

### "Email provider unauthorized" Error
- Verify `BREVO_API_KEY` in `.env`
- Check if sender email is verified in Brevo dashboard
- Ensure environment variables are loaded correctly

### "Unauthorized API usage" Error
- API key may be expired or inactive
- Generate a new API key from Brevo dashboard

### Emails Not Sending (Dev Mode)
- Check if `EMAIL_LOG_ONLY=true` - if so, emails are logged, not sent
- Set `NODE_ENV=production` for actual sending

### SMTP Alternative (Optional)
If you prefer SMTP over API:
- Brevo provides SMTP credentials in **Settings → SMTP & API**
- We can modify email.js to use Nodemailer with SMTP instead

---

## Rollback to SendGrid (If Needed)

If you need to revert:
1. Restore the original SendGrid package in `package.json`
2. Restore original `email.js` implementation
3. Update environment variables back to `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

---

## Questions or Issues?
- Brevo Support: https://help.brevo.com
- Brevo API Docs: https://developers.brevo.com/docs
