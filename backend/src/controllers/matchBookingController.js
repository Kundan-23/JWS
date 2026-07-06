const Razorpay   = require('razorpay');
const crypto     = require('crypto');
const supabase   = require('../config/supabase');          // ← FIXED: direct require, not destructured
const asyncHandler = require('../utils/asyncHandler');

// Types that go through Razorpay player booking
const BOOKABLE_TYPES = ['league', 'trial', 'friendly', 'tournament'];

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── GET /api/player/available-matches ────────────────────────────
exports.getAvailableMatches = asyncHandler(async (req, res) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('matches')
    .select('id, title, match_type, type, age_category, date, venue, location, description, price_per_slot, total_slots, booked_slots')
    .gte('date', now)
    .order('date', { ascending: true });

  if (error) {
    console.error('[getAvailableMatches]', error.message);
    return res.json({ success: true, matches: [] });
  }

  // Only League / Friendly / Tournament go to players for direct booking
  const bookable = (data || []).filter(m => {
    const t = (m.match_type || m.type || '').toLowerCase();
    return BOOKABLE_TYPES.includes(t);
  }).map(m => ({
    ...m,
    match_type: m.match_type || m.type,
    venue:      m.venue      || m.location,
  }));

  res.json({ success: true, matches: bookable });
});

// ─── GET /api/player/my-bookings ──────────────────────────────────
exports.getMyBookings = asyncHandler(async (req, res) => {
  const playerId = req.user.id;
  const { data, error } = await supabase
    .from('match_bookings')
    .select('match_id, status, amount_paid, created_at, razorpay_payment_id')
    .eq('player_id', playerId)
    .eq('status', 'confirmed');

  if (error) {
    console.error('[getMyBookings]', error.message);
    return res.json({ success: true, bookings: [] });
  }
  res.json({ success: true, bookings: data || [] });
});

// ─── POST /api/player/book-match/order ────────────────────────────
exports.createBookingOrder = asyncHandler(async (req, res) => {
  const { matchId } = req.body;
  const playerId    = req.user.id;

  if (!matchId) {
    return res.status(400).json({ success: false, message: 'matchId is required.' });
  }

  // Verify match exists
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();

  if (matchErr || !match) {
    return res.status(404).json({ success: false, message: 'Match not found.' });
  }

  // Check match type is bookable
  const mt = (match.match_type || match.type || '').toLowerCase();
  if (!BOOKABLE_TYPES.includes(mt)) {
    return res.status(400).json({ success: false, message: 'This match type cannot be booked directly.' });
  }

  // Check slots available
  if (match.total_slots > 0 && (match.booked_slots || 0) >= match.total_slots) {
    return res.status(400).json({ success: false, message: 'This match is fully booked.' });
  }

  // Prevent double booking
  const { data: existing } = await supabase
    .from('match_bookings')
    .select('id, status')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .maybeSingle();

  if (existing) {
    return res.status(400).json({
      success: false,
      message: existing.status === 'confirmed'
        ? 'You have already booked a slot for this match.'
        : 'A booking is already in progress for this match.'
    });
  }

  const amount = Number(match.price_per_slot || 0);

  if (amount <= 0) {
    // Free match — shouldn't happen per product spec but handled gracefully
    return res.status(400).json({ success: false, message: 'This match has no price set. Contact admin.' });
  }

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount:   Math.round(amount * 100),  // paise
    currency: 'INR',
    receipt:  `gicl_match_${matchId.slice(0,8)}_${Date.now()}`,
    notes: {
      match_id:  matchId,
      player_id: playerId,
      match:     match.title || 'GICL Match',
    },
  });

  res.json({
    success:  true,
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    matchTitle: match.title || 'GICL Match',
    venue:      match.venue || match.location || '',
  });
});

// ─── POST /api/player/book-match/verify ───────────────────────────
exports.verifyBookingPayment = asyncHandler(async (req, res) => {
  const { matchId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const playerId = req.user.id;

  if (!matchId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
  }

  // Verify Razorpay signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
  }

  // Fetch match for amount
  const { data: match } = await supabase
    .from('matches')
    .select('price_per_slot, booked_slots, total_slots')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found.' });
  }

  // Final slot check (race condition guard)
  if (match.total_slots > 0 && (match.booked_slots || 0) >= match.total_slots) {
    return res.status(400).json({ success: false, message: 'Match became fully booked during payment. Refund will be initiated.' });
  }

  // Insert booking record
  const { error: insertErr } = await supabase.from('match_bookings').insert({
    match_id:            matchId,
    player_id:           playerId,
    razorpay_order_id,
    razorpay_payment_id,
    amount_paid:         match.price_per_slot || 0,
    status:              'confirmed',
  });

  if (insertErr) {
    // Unique constraint violation = duplicate booking
    if (insertErr.code === '23505') {
      return res.status(400).json({ success: false, message: 'You have already booked this match.' });
    }
    throw new Error('Failed to record booking: ' + insertErr.message);
  }

  // Increment booked_slots atomically
  await supabase
    .from('matches')
    .update({ booked_slots: (match.booked_slots || 0) + 1 })
    .eq('id', matchId);

  // Notify Player
  const { createNotification, notifyAdmins } = require('./notificationController');
  createNotification(
    playerId,
    'player',
    'Booking Confirmed',
    'Your spot for the match has been successfully confirmed. Get ready to play!',
    'match_update',
    '/dashboard/matches'
  );

  // Notify Admins
  notifyAdmins(
    'New Match Booking',
    `A new booking was placed for Match ID: ${matchId}.`,
    'match_booking',
    '/admin-dashboard/matches'
  );

  res.json({ success: true, message: 'Payment verified! Your slot is confirmed. 🎉' });
});

// ─── GET /api/admin/matches/:id/bookings ──────────────────────────
// (called from admin routes)
exports.getMatchBookings = asyncHandler(async (req, res) => {
  const matchId = req.params.id;

  const { data: match } = await supabase
    .from('matches')
    .select('id, title, total_slots, booked_slots')
    .eq('id', matchId)
    .maybeSingle();

  const { data: bookings, error } = await supabase
    .from('match_bookings')
    .select('id, player_id, amount_paid, status, razorpay_payment_id, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getMatchBookings]', error.message);
    return res.json({ success: true, match, bookings: [] });
  }

  // Enrich with player details
  const playerIds = [...new Set((bookings || []).map(b => b.player_id).filter(Boolean))];
  const { data: players } = playerIds.length > 0
    ? await supabase.from('players').select('id, first_name, last_name, gicl_id, email').in('id', playerIds)
    : { data: [] };

  const playerMap = Object.fromEntries((players || []).map(p => [p.id, p]));

  const enriched = (bookings || []).map(b => ({
    ...b,
    player: playerMap[b.player_id] || { first_name: 'Unknown', last_name: 'Player' },
  }));

  res.json({ success: true, match, bookings: enriched });
});
