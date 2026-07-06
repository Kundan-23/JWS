const axios = require('axios');

/**
 * Send an email via MailerSend REST API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
async function sendEmail(to, subject, html) {
  const apiKey = process.env.MAILERSEND_API_KEY;

  if (!apiKey) throw new Error('MAILERSEND_API_KEY is not set in .env');

  const response = await axios.post(
    'https://api.mailersend.com/v1/email',
    {
      from: {
        name:  process.env.MAILERSEND_FROM_NAME  || 'JWS 2026',
        email: process.env.MAILERSEND_FROM_EMAIL || 'info@jws2026.com',
      },
      to: [{ email: to }],
      subject,
      html: html,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }
  );

  return response.data;
}

module.exports = { sendEmail };
