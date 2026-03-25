const sgMail = require('@sendgrid/mail');
require('dotenv').config();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendEmail = async (mailOptions) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
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

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'https://autograder-4usv.onrender.com';
};

module.exports = {
  sendEmail,
  getFrontendUrl,
};
