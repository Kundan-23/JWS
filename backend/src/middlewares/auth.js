const jwt      = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Verifies JWT and re-reads role from DB.
 * This ensures stale tokens or registration tokens with null/wrong roles
 * always get the correct current role.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth Error] Missing or malformed authHeader:', authHeader);
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('[Auth Error] jwt.verify failed for token:', token.substring(0, 20) + '...', 'Error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  // Re-read role from DB — never trust JWT role alone
  try {
    const { data: row } = await supabase
      .from('players')
      .select('id, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (row) {
      req.user = { ...decoded, role: row.role || 'player' };
      return next();
    }

    // Not in players — try coaches
    const { data: coach } = await supabase
      .from('coaches')
      .select('id, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (coach) {
      req.user = { ...decoded, role: 'coach' };
      return next();
    }

    // Not in coaches — try admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('id, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (admin) {
      req.user = { ...decoded, role: 'admin' };
      return next();
    }

    // User not found in any table — token is orphaned
    console.error('[Auth Error] Account not found in DB for decoded.id:', decoded.id);
    return res.status(401).json({ success: false, message: 'Account not found.' });

  } catch (dbErr) {
    // DB lookup failed — fall back to JWT role to not break the app
    console.error('[Auth] DB role lookup failed, using JWT role:', dbErr.message);
    req.user = decoded;
    return next();
  }
}

/**
 * Role-based access guard
 * Usage: authorize('admin') or authorize('admin', 'coach')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

/**
 * Alias for authenticate — used by routes that follow Express convention
 * of naming the auth guard "protect".
 */
const protect = authenticate;

/**
 * Role-based access guard (restrictTo style)
 * Usage: restrictTo('admin') or restrictTo('admin', 'coach')
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// ─── Viewer-only admin paths (whitelist of allowed path prefixes) ─────────────
const READ_ONLY_ADMIN_EMAIL     = 'jwsadmin2026@gmail.com';
const READ_ONLY_FORBIDDEN_PATHS = ['/config', '/coach-uploads', '/squads', '/training-slots', '/allotment', '/cashouts'];

/**
 * Blocks modifying requests and sensitive sections for the read-only viewer admin account.
 * Must be applied AFTER authenticate + restrictTo('admin').
 */
function checkReadOnlyAdmin(req, res, next) {
  if (!req.user || req.user.email !== READ_ONLY_ADMIN_EMAIL) return next();

  // Block any write action
  if (req.method !== 'GET') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Viewer admin accounts cannot perform write operations.',
    });
  }

  // Block access to forbidden sections even on GET
  if (READ_ONLY_FORBIDDEN_PATHS.some(p => req.path.startsWith(p))) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Viewer admin does not have access to this section.',
    });
  }

  next();
}

module.exports = { authenticate, authorize, protect, restrictTo, checkReadOnlyAdmin };
