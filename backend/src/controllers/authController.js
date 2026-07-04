const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const supabase              = require('../config/supabase');
const { sendOTP, verifyOTP } = require('../utils/otp');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = 12;

// ─── Helpers ───────────────────────────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
}

function signSessionToken(email, purpose) {
  // Short-lived token to link OTP verification → set password step
  return jwt.sign({ email, purpose, type: 'session' }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function signResetToken(email) {
  return jwt.sign({ email, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// ─── POST /api/auth/send-otp ───────────────────────────────
exports.sendOTP = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;

  if (purpose === 'register') {
    // Check email not already registered
    const { data: existing } = await supabase.from('players').select('id').eq('email', email).maybeSingle();
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
  }

  if (purpose === 'reset_password') {
    // Check email exists across all roles
    const [{ data: player }, { data: coach }, { data: admin }] = await Promise.all([
      supabase.from('players').select('id').eq('email', email).maybeSingle(),
      supabase.from('coaches').select('id').eq('email', email).maybeSingle(),
      supabase.from('admins').select('id').eq('email', email).maybeSingle(),
    ]);
    if (!player && !coach && !admin) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }
  }

  const result = await sendOTP(email, purpose);
  res.json({ success: true, message: 'OTP sent to your email.', expiresIn: result.expiresIn });
});

// ─── POST /api/auth/verify-otp ────────────────────────────
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, code, purpose } = req.body;

  await verifyOTP(email, code, purpose);

  if (purpose === 'register') {
    const sessionToken = signSessionToken(email, 'register');
    return res.json({ success: true, message: 'Email verified.', sessionToken });
  }

  if (purpose === 'reset_password') {
    const resetToken = signResetToken(email);
    return res.json({ success: true, message: 'OTP verified.', resetToken });
  }
});

// ─── POST /api/auth/set-password (Registration Step 3) ────
exports.setPassword = asyncHandler(async (req, res) => {
  const { sessionToken, password } = req.body;

  // Verify session token
  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Session expired. Please start registration again.' });
  }

  if (decoded.type !== 'session' || decoded.purpose !== 'register') {
    return res.status(400).json({ success: false, message: 'Invalid session token.' });
  }

  const { email } = decoded;

  // Double-check email not already taken
  const { data: existing } = await supabase.from('players').select('id').eq('email', email).maybeSingle();
  if (existing) {
    return res.status(409).json({ success: false, message: 'Account already exists. Please login.' });
  }

  const password_hash  = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: player, error } = await supabase
    .from('players')
    .insert({ email, password_hash, role: 'player' })
    .select()
    .single();

  if (error) throw new Error('Failed to create account: ' + error.message);

  // Notify Admins
  const { notifyAdmins } = require('./notificationController');
  notifyAdmins(
    'New Player Registered',
    `A new player (${email}) has joined JWS Sports.`,
    'registration',
    '/admin-dashboard/users'
  );

  const tokenPayload = { id: player.id, email: player.email, role: player.role };
  const token        = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    refreshToken,
    user: { id: player.id, email: player.email, role: player.role, giclId: player.gicl_id },
  });
});

// ─── POST /api/auth/login ──────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user across all roles
  let user = null;
  let role = null;
  let table = null;

  const [{ data: player }, { data: coach }, { data: admin }] = await Promise.all([
    supabase.from('players').select('*').eq('email', email).maybeSingle(),
    supabase.from('coaches').select('*').eq('email', email).maybeSingle(),
    supabase.from('admins').select('*').eq('email', email).maybeSingle(),
  ]);

  if (player) {
    user = player;
    // Use the role column from DB — admin accounts may be stored in players table
    role = player.role || 'player';
    table = 'players';
  } else if (coach) { user = coach; role = 'coach'; table = 'coaches'; }
  else if (admin) { user = admin; role = 'admin'; table = 'admins'; }

  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email.' });
  }

  if (!user.password_hash) {
    return res.status(400).json({ success: false, message: 'Password not set. Please complete registration.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }

  // Check player/coach status (never block admin)
  if (role !== 'admin' && (role === 'player' || role === 'coach') && user.status === 'Disabled') {
    const reasonMsg = user.status_reason ? ` Reason: ${user.status_reason}` : '';
    return res.status(403).json({ success: false, message: `Your account has been disabled.${reasonMsg}` });
  }

  const tokenPayload = { id: user.id, email: user.email, role };
  const token        = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  const userData = {
    id:    user.id,
    email: user.email,
    role,
    ...(role === 'player' && {
      giclId:              user.gicl_id,
      firstName:           user.first_name,
      lastName:            user.last_name,
      isDashboardUnlocked: user.is_dashboard_unlocked,
      payment_status:      user.payment_status,
      plan:                user.plan,
    }),
    ...(role === 'coach' && {
      giclId:    user.gicl_id,
      firstName: user.first_name,
      lastName:  user.last_name,
      status:    user.status,
    }),
    ...(role === 'admin' && {
      name:      user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin',
      firstName: user.first_name,
      lastName:  user.last_name,
    }),
  };

  res.json({ success: true, token, refreshToken, role, user: userData });
});

// ─── POST /api/auth/reset-password ────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Reset token expired or invalid.' });
  }

  if (decoded.type !== 'reset') {
    return res.status(400).json({ success: false, message: 'Invalid reset token.' });
  }

  const { email } = decoded;
  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update whichever table has this email
  const [playerRes, coachRes, adminRes] = await Promise.all([
    supabase.from('players').update({ password_hash }).eq('email', email),
    supabase.from('coaches').update({ password_hash }).eq('email', email),
    supabase.from('admins').update({ password_hash }).eq('email', email),
  ]);

  res.json({ success: true, message: 'Password updated successfully. Please login.' });
});

// ─── POST /api/auth/refresh ────────────────────────────────
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
  }

  const token = signAccessToken({ id: decoded.id, email: decoded.email, role: decoded.role });
  res.json({ success: true, token });
});

// ─── POST /api/auth/logout ────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // Client should clear localStorage. Server is stateless with JWT.
  res.json({ success: true, message: 'Logged out successfully.' });
});

exports.me = asyncHandler(async (req, res) => {
  const { id } = req.user;

  // Always re-read from DB so stale JWT roles are corrected in real-time.
  // Admin accounts may live in the players table with role='admin'.
  // Try players first, then coaches, then admins table.
  let user = null;

  const { data: playerRow } = await supabase
    .from('players')
    .select('id, email, role, first_name, last_name, gicl_id, is_dashboard_unlocked, payment_status, plan, batting_style, bowling_style, height, weight, created_at')
    .eq('id', id)
    .maybeSingle();

  if (playerRow) {
    user = playerRow;
  } else {
    const { data: coachRow } = await supabase
      .from('coaches')
      .select('id, email, role, first_name, last_name, gicl_id, status, created_at')
      .eq('id', id)
      .maybeSingle();

    if (coachRow) {
      user = { ...coachRow, role: 'coach' };
    } else {
      const { data: adminRow } = await supabase
        .from('admins')
        .select('id, email, role, first_name, last_name, created_at')
        .eq('id', id)
        .maybeSingle();
      if (adminRow) user = { ...adminRow, role: 'admin' };
    }
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Remove sensitive fields
  delete user.password_hash;

  res.json({ success: true, user });
});

