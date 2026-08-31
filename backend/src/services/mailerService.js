const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host || !env.smtp.user) {
    // No SMTP configured (common in local dev) — fall back to console logging
    // so the flow can still be tested end-to-end without a real mail server.
    transporter = {
      sendMail: async (options) => {
        logger.warn('[mailer] SMTP not configured — logging email instead of sending:');
        logger.info(JSON.stringify(options, null, 2));
      },
    };
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.password },
  });
  return transporter;
}

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
  await getTransporter().sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: 'Verify your email address',
    html: `<p>Welcome! Please verify your email by clicking the link below:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>If you did not create this account, you can ignore this email.</p>`,
  });
}

async function sendPasswordResetEmail(toEmail, token) {
  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  await getTransporter().sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: 'Reset your password',
    html: `<p>We received a request to reset your password.</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
