const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendEmail = async (mailOptions) => {
  try {
    const shouldLogOnly =
      String(process.env.EMAIL_LOG_ONLY || "").toLowerCase() === "true" ||
      (!process.env.BREVO_SMTP_KEY && process.env.NODE_ENV !== "production");

    if (shouldLogOnly) {
      console.log('Email would be sent in production:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.html);
      return { messageId: 'dev-mode' };
    }

    const mailData = {
      from: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    };

    return await transporter.sendMail(mailData);
  } catch (error) {
    console.error('Brevo SMTP error:', error);
    throw error;
  }
};

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host");
    if (host) {
      return `${proto}://${host}`;
    }
  }

  return "http://localhost:5173";
};

module.exports = {
  sendEmail,
  getFrontendUrl,
};
