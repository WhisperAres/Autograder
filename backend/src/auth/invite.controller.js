const crypto = require('crypto');
const nodemailer = require('nodemailer');
const StudentInvite = require('../models/studentInvite');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Email configuration for both localhost and production
const getEmailTransporter = () => {
  // For production, you should use your email service (Gmail, SendGrid, etc.)
  // For development, you can use a test account or console logging
  
  if (process.env.NODE_ENV === 'production') {
    // Production: Use your email service
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development: Log emails to console instead of sending
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 Email would be sent in production:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Body:', mailOptions.text);
        return { messageId: 'dev-mode' };
      },
    };
  }
};

// Generate unique invite token
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Get frontend URL based on environment
const getFrontendUrl = () => {
    return 'https://autograder-4usv.onrender.com';
};

// Send invite emails to multiple students
exports.sendInvites = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Please provide a list of valid email addresses' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter(e => emailRegex.test(e));

    if (validEmails.length === 0) {
      return res.status(400).json({ message: 'No valid email addresses provided' });
    }

    const transporter = getEmailTransporter();
    const frontendUrl = getFrontendUrl();
    const inviteDurationHours = parseInt(process.env.INVITE_EXPIRY_HOURS) || 168; // Default 7 days
    const invites = [];
    const results = {
      success: [],
      failed: [],
    };

    for (const email of validEmails) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          results.failed.push({
            email,
            reason: 'User already registered with this email',
          });
          continue;
        }

        // Check if invite already exists and is still valid
        const existingInvite = await StudentInvite.findOne({
          where: { email, used: false },
        });

        let token;
        if (existingInvite && new Date(existingInvite.expiresAt) > new Date()) {
          // Reuse existing valid invite
          token = existingInvite.token;
        } else {
          // Generate new invite
          token = generateInviteToken();
          const expiresAt = new Date(Date.now() + inviteDurationHours * 60 * 60 * 1000);

          await StudentInvite.create({
            email,
            token,
            expiresAt,
          });
        }

        // Create invite link
        const inviteLink = `${frontendUrl}/student-signup?token=${token}`;

        // Send email
        const mailOptions = {
          to: email,
          subject: 'You are invited to join our Autograder Platform!',
          html: `
            <h2>Welcome to Autograder!</h2>
            <p>You have been invited to join our platform as a student.</p>
            <p>Click the link below to create your account:</p>
            <a href="${inviteLink}" style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 10px 0;
            ">Complete Your Sign Up</a>
            <p>Or copy this link: <code>${inviteLink}</code></p>
            <p><strong>Note:</strong> This invite link will expire in ${inviteDurationHours} hours.</p>
            <p>If you have any questions, please contact your administrator.</p>
          `,
          text: `You have been invited to join our Autograder Platform! 
Click the link to sign up: ${inviteLink}
This link expires in ${inviteDurationHours} hours.`,
        };

        await transporter.sendMail(mailOptions);
        results.success.push(email);
        invites.push({ email, inviteLink });
      } catch (error) {
        console.error(`Error processing invite for ${email}:`, error);
        results.failed.push({
          email,
          reason: error.message,
        });
      }
    }

    res.json({
      message: 'Invitations processed',
      results: {
        successCount: results.success.length,
        failureCount: results.failed.length,
        successEmails: results.success,
        failedEmails: results.failed,
      },
      // In development, return the invite links for testing
      ...(process.env.NODE_ENV !== 'production' && { invites }),
    });
  } catch (error) {
    console.error('Send invites error:', error);
    res.status(500).json({ message: 'Error sending invitations', error: error.message });
  }
};

// Validate invite token
exports.validateInvite = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const invite = await StudentInvite.findOne({ where: { token } });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite token' });
    }

    if (invite.used) {
      return res.status(400).json({ message: 'This invite has already been used' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This invite has expired' });
    }

    res.json({
      valid: true,
      email: invite.email,
      message: 'Invite is valid',
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    res.status(500).json({ message: 'Error validating invite', error: error.message });
  }
};

// Complete student signup
exports.completeSignup = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const invite = await StudentInvite.findOne({ where: { token } });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite token' });
    }

    if (invite.used) {
      return res.status(400).json({ message: 'This invite has already been used' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This invite has expired' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: invite.email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      email: invite.email,
      password: hashedPassword,
      name: invite.email.split('@')[0], // Use part of email as default name
      role: 'student',
    });

    // Mark invite as used
    await StudentInvite.update(
      { used: true, usedAt: new Date() },
      { where: { id: invite.id } }
    );

    res.json({
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Complete signup error:', error);
    res.status(500).json({ message: 'Error completing signup', error: error.message });
  }
};
