const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { sendEmail: sendEmailViaBrevo } = require('../config/brevo');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_OTP_PER_WINDOW = 3;  // max 3 OTPs per email per 10 min

/**
 * Generate a 6-digit numeric OTP
 */
function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create OTP, hash it, store in DB, send via Brevo email
 * @param {string} email
 * @param {'register'|'reset_password'} purpose
 */
async function sendOTP(email, purpose) {
  // Rate limiting: max 3 OTPs per email per 10 minutes
  const windowStart = new Date(Date.now() - OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('otp_codes')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('purpose', purpose)
    .gte('created_at', windowStart);

  if (count >= MAX_OTP_PER_WINDOW) {
    throw Object.assign(new Error('Too many OTP requests. Please wait 10 minutes.'), { statusCode: 429 });
  }

  const code = generateOTPCode();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error } = await supabase.from('otp_codes').insert({
    email,
    code: hashedCode,
    purpose,
    expires_at: expiresAt,
    used: false,
    attempts: 0,
  });

  if (error) throw new Error('Failed to store OTP: ' + error.message);

  // During development, log the OTP to the console
  console.log(`\n================================`);
  console.log(`  OTP for ${email}: ${code}  `);
  console.log(`================================\n`);

  // Send email via Brevo (catch errors so unverified domains don't crash testing)
  const html = getOTPEmailTemplate(code, purpose);
  try {
    await sendEmailViaBrevo(email, getOTPSubject(purpose), html);
  } catch (err) {
    console.error('⚠️ Could not send email via Brevo. Check the console above for your OTP.', err.message);
  }

  return { expiresIn: OTP_EXPIRY_MINUTES * 60 };
}

/**
 * Verify OTP from DB
 * @param {string} email
 * @param {string} code - Plain text OTP entered by user
 * @param {'register'|'reset_password'} purpose
 * @returns {Promise<boolean>}
 */
async function verifyOTP(email, code, purpose) {
  // Get latest unused OTP for this email + purpose
  const { data: otpRecord, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otpRecord) {
    throw Object.assign(new Error('OTP expired or not found. Please request a new one.'), { statusCode: 400 });
  }

  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    throw Object.assign(new Error('Too many wrong attempts. Please request a new OTP.'), { statusCode: 400 });
  }

  const isValid = await bcrypt.compare(code, otpRecord.code);

  if (!isValid) {
    // Increment failed attempts
    await supabase
      .from('otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    const remaining = MAX_ATTEMPTS - (otpRecord.attempts + 1);
    throw Object.assign(
      new Error(`Incorrect OTP. ${remaining} attempt(s) remaining.`),
      { statusCode: 400 }
    );
  }

  // Mark OTP as used
  await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

  return true;
}

function getOTPSubject(purpose) {
  if (purpose === 'register') return 'Verify your JWS Sports account';
  if (purpose === 'reset_password') return 'Reset your JWS Sports password';
  return 'Your JWS Sports OTP';
}

function getOTPEmailTemplate(code, purpose) {
  const action = purpose === 'register' ? 'verify your email' : 'reset your password';
  return `
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 40px 0;">
    <div style="max-width: 480px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #FFD700;">
      <div style="background: linear-gradient(135deg, #2a1d4e, #6b4fa8); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #cbf905; font-size: 28px; font-weight: 900; letter-spacing: 2px;">JWS SPORTS</h1>
        <p style="margin: 4px 0 0; color: #ccc; font-size: 13px;">Junior World Cup Series 2026</p>
      </div>
      <div style="padding: 40px 32px; text-align: center;">
        <p style="color: #ccc; font-size: 15px; margin: 0 0 24px;">Use the code below to ${action}:</p>
        <div style="background: #0a0a0a; border: 2px solid #FFD700; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
          <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #FFD700;">${code}</span>
        </div>
        <p style="color: #888; font-size: 13px; margin: 0;">This code expires in <strong style="color: #FFD700;">10 minutes</strong>.</p>
        <p style="color: #888; font-size: 13px; margin: 8px 0 0;">Do not share this code with anyone.</p>
      </div>
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #333;">
        <p style="color: #555; font-size: 12px; margin: 0;">If you didn't request this, ignore this email.</p>
        <p style="color: #555; font-size: 12px; margin: 4px 0 0;">© 2026 JWS Sports. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>`;
}

module.exports = { sendOTP, verifyOTP };
