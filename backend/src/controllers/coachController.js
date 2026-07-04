const { v4: uuidv4 } = require('uuid');
const supabase     = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const { data: coach, error } = await supabase.from('coaches').select('*').eq('id', req.user.id).single();
  if (error || !coach) return res.status(404).json({ success: false, message: 'Coach not found.' });
  delete coach.password_hash;
  res.json({ success: true, coach });
});

exports.getPlayers = asyncHandler(async (req, res) => {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, gicl_id, first_name, last_name, dob, email, whatsapp, city, plan, payment_status, docs_approved, batting_style, bowling_style, profile_photo_url')
    .eq('allocated_coach_id', req.user.id)
    .order('first_name', { ascending: true });
  if (error) throw new Error(error.message);
  res.json({ success: true, players: players || [] });
});

exports.getVideos = asyncHandler(async (req, res) => {
  // 1. Get all players assigned to this coach
  const { data: playersList, error: pError } = await supabase
    .from('players')
    .select('id, first_name, last_name, gicl_id, profile_photo_url')
    .eq('allocated_coach_id', req.user.id);

  if (pError) throw new Error(pError.message);
  if (!playersList || playersList.length === 0) {
    return res.json({ success: true, videos: [] });
  }

  const playerIds = playersList.map(p => p.id);

  // 2. Fetch videos for these players from the player_videos table
  const { data: dbVideos, error } = await supabase
    .from('player_videos')
    .select('*')
    .in('player_id', playerIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // 3. Map to the format the frontend expects
  const videos = (dbVideos || []).map(v => {
    const p = playersList.find(p => p.id === v.player_id);
    return {
      id: v.id,
      player_id: v.player_id,
      url: v.video_url,
      title: v.title || 'Gameplay Video',
      thumbnail: v.thumbnail_url || p?.profile_photo_url || '/images/default-avatar.png',
      status: v.status || 'Pending',
      review_flag: v.review_flag,
      review_comment: v.review_comment,
      playerName: p ? `${p.first_name} ${p.last_name}` : 'Unknown Player',
      players: p ? {
        first_name: p.first_name,
        last_name: p.last_name,
        gicl_id: p.gicl_id,
        profile_photo_url: p.profile_photo_url
      } : null
    };
  });

  res.json({ success: true, videos });
});

exports.reviewVideo = asyncHandler(async (req, res) => {
  const { flag, comment } = req.body; // flag: 'green'|'yellow'|'red'
  
  const { data, error } = await supabase
    .from('player_videos')
    .update({ 
      status: 'Reviewed', 
      review_flag: flag, 
      review_comment: comment,
      reviewed_by: req.user.id
    })
    .eq('id', req.params.id)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  res.json({ success: true, video: data });
});

exports.addUpload = asyncHandler(async (req, res) => {
  const { title, url } = req.body;
  if (!title || !url) return res.status(400).json({ success: false, message: 'Title and URL are required.' });

  const { data: video, error } = await supabase
    .from('coach_video_uploads')
    .insert({
      coach_id: req.user.id,
      title,
      url,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify Admins
  const { notifyAdmins } = require('./notificationController');
  notifyAdmins(
    'New Video Submission',
    `A coach has submitted a new video: "${title}".`,
    'video_upload',
    '/admin-dashboard/videos'
  );

  res.status(201).json({ success: true, message: 'Video uploaded successfully', data: video });
});

exports.getMyUploads = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('coach_video_uploads')
    .select('*')
    .eq('coach_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  res.json({ success: true, uploads: data || [] });
});

exports.getMatches = asyncHandler(async (req, res) => {
  const { data: matchIds } = await supabase.from('match_coaches').select('match_id').eq('coach_id', req.user.id);
  if (!matchIds || matchIds.length === 0) return res.json({ success: true, matches: [] });
  const ids = matchIds.map((m) => m.match_id);
  const { data: matches, error } = await supabase.from('matches').select('*').in('id', ids).order('date', { ascending: true });
  if (error) throw new Error(error.message);
  res.json({ success: true, matches });
});

exports.getReferrals = asyncHandler(async (req, res) => {
  const coachId = req.user.id;

  const { data: coach } = await supabase
    .from('coaches')
    .select('referral_code, referral_points')
    .eq('id', coachId)
    .single();

  const { data: directReferrals } = await supabase
    .from('players')
    .select('id, first_name, last_name, gicl_id, payment_status, created_at')
    .eq('referred_by_id', coachId)
    .order('created_at', { ascending: false });

  const { data: ledger } = await supabase
    .from('referrals')
    .select('*, referred_id(first_name, last_name, gicl_id, created_at)')
    .eq('referrer_id', coachId)
    .order('created_at', { ascending: false });

  const { data: cfg } = await supabase
    .from('app_config')
    .select('referral_min_cashout, referral_level1, referral_level2, referral_level3plus')
    .eq('id', 1)
    .single();

  res.json({
    success: true,
    referralCode:    coach?.referral_code,
    balance:         coach?.referral_points || 0,
    minCashout:      cfg?.referral_min_cashout || 500,
    bonusLevels:     { level1: cfg?.referral_level1 ?? 50, level2: cfg?.referral_level2 ?? 20, level3plus: cfg?.referral_level3plus ?? 10 },
    directReferrals: directReferrals || [],
    ledger:          ledger || [],
  });
});

exports.requestCashout = asyncHandler(async (req, res) => {
  const { amount, method, upiId, bankName, accountNo, ifscCode } = req.body;
  const coachId = req.user.id;

  const { data: coach } = await supabase
    .from('coaches')
    .select('referral_points')
    .eq('id', coachId)
    .single();

  const balance = coach?.referral_points || 0;

  const { data: cfg } = await supabase
    .from('app_config')
    .select('referral_min_cashout')
    .eq('id', 1)
    .single();

  const minCashout = cfg?.referral_min_cashout || 500;

  if (amount < minCashout) {
    return res.status(400).json({ success: false, message: `Minimum cashout is ₹${minCashout}.` });
  }
  if (amount > balance) {
    return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${balance}.` });
  }

  const { data: pending } = await supabase
    .from('cashout_requests')
    .select('id')
    .eq('player_id', coachId)
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    return res.status(409).json({ success: false, message: 'You already have a pending cashout request.' });
  }

  if (method === 'upi' && !upiId) {
    return res.status(400).json({ success: false, message: 'UPI ID is required.' });
  }
  if (method === 'bank' && (!bankName || !accountNo || !ifscCode)) {
    return res.status(400).json({ success: false, message: 'Bank name, account number, and IFSC are required.' });
  }

  const { data: cashout, error } = await supabase
    .from('cashout_requests')
    .insert({ player_id: coachId, amount, method, upi_id: upiId || null, bank_name: bankName || null, account_no: accountNo || null, ifsc_code: ifscCode || null })
    .select()
    .single();

  if (error) throw new Error('Failed to submit cashout: ' + error.message);

  // Deduct from balance
  await supabase.from('coaches').update({ referral_points: balance - amount }).eq('id', coachId);

  // Notify Admins
  const { notifyAdmins } = require('./notificationController');
  notifyAdmins(
    'New Coach Cashout Request',
    `A coach requested a cashout of ₹${amount}.`,
    'cashout',
    '/admin-dashboard/cashouts'
  );

  res.status(201).json({
    success: true,
    message: `Cashout of ₹${amount} submitted. Admin will process within 3-5 business days.`,
    cashout,
    newBalance: balance - amount,
  });
});
