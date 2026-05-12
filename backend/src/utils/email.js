const brevo = require('brevo');
require('dotenv').config();

const sendEmail = async (mailOptions) => {
  try {
    const shouldLogOnly =
      String(process.env.EMAIL_LOG_ONLY || "").toLowerCase() === "true" ||
      (!process.env.BREVO_API_KEY && process.env.NODE_ENV !== "production");

    if (shouldLogOnly) {
      console.log('Email would be sent in production:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.html);
      return { messageId: 'dev-mode' };
    }

    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.ApiClient.instance.authentications['api-key'], process.env.BREVO_API_KEY);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.htmlContent = mailOptions.html;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Autograder',
      email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
    };
    sendSmtpEmail.to = [{ email: mailOptions.to }];

    if (mailOptions.text) {
      sendSmtpEmail.textContent = mailOptions.text;
    }

    return await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error('Brevo error:', error);
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
