const axios = require('axios');

/**
 * Send an email via Brevo REST API
 * Uses BREVO_API_KEY (xkeysib-...) — more reliable than SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
async function sendEmail(to, subject, html) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) throw new Error('BREVO_API_KEY is not set in .env');

  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name:  process.env.BREVO_FROM_NAME  || 'JWS Sports',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@jwssports.com',
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        'accept':       'application/json',
        'api-key':      apiKey,
        'content-type': 'application/json',
      },
    }
  );

  return response.data;
}

module.exports = { sendEmail };
