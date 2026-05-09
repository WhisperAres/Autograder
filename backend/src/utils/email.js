const sgMail = require('@sendgrid/mail');
require('dotenv').config();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendEmail = async (mailOptions) => {
  try {
    const shouldLogOnly =
      String(process.env.EMAIL_LOG_ONLY || "").toLowerCase() === "true" ||
      (!process.env.SENDGRID_API_KEY && process.env.NODE_ENV !== "production");

    if (shouldLogOnly) {
      console.log('Email would be sent in production:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.html);
      return { messageId: 'dev-mode' };
    }

    const msg = {
      to: mailOptions.to,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    };

    return await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid error:', error);
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
