const path         = require('path');
const ExcelJS      = require('exceljs');
const supabase     = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('./notificationController');

// ─── GET /api/admin/stats ─────────────────────────────────────────
exports.getStats = asyncHandler(async (req, res) => {
  const [
    { count: totalPlayers },
    { data: paidPlayersData, count: paidPlayers },
    { data: recentPlayers },
    { count: pendingAllotment },
    { data: configData }
  ] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('plan', { count: 'exact' }).eq('payment_status', 'paid'),
    supabase.from('players').select('id, first_name, last_name, gicl_id, email, plan, payment_status, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('players').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid').is('allocated_coach_id', null),
    supabase.from('app_config').select('plans').eq('id', 1).single()
  ]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase.from('players').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());

  // Calculate estimated revenue
  const configPlans = configData?.plans || [];
  const planPrices = {};
  configPlans.forEach(p => planPrices[p.id] = Number(p.price) || 0);

  const estimatedRevenue = (paidPlayersData || []).reduce((sum, player) => {
    return sum + (planPrices[player.plan] || 0);
  }, 0);

  res.json({
    success: true,
    stats: { 
      totalPlayers, 
      paidPlayers, 
      todayRegistrations: todayCount, 
      pendingAllotment,
      pendingVideoReview: 0,
      estimatedRevenue
    },
    recentPlayers: recentPlayers || [],
  });
});

// ─── GET /api/admin/players ───────────────────────────────────────
exports.getPlayers = asyncHandler(async (req, res) => {
  const { search, plan, payment, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('players')
    .select('id, gicl_id, first_name, last_name, middle_name, email, whatsapp, gender, dob, plan, payment_status, docs_approved, is_dashboard_unlocked, allocated_coach_id, created_at, profile_photo_url, city, country, zip_code, aadhar_url, batting_style, bowling_style', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (search) query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,gicl_id.ilike.%${search}%`);
  if (plan)    query = query.eq('plan', plan);
  if (payment) query = query.eq('payment_status', payment);

  const { data: players, count, error } = await query;
  if (error) throw new Error(error.message);

  res.json({ success: true, players: players || [], total: count, page: Number(page), limit: Number(limit) });
});

// ─── GET /api/admin/players/export ────────────────────────────────
exports.exportPlayers = asyncHandler(async (req, res) => {
  const { search, plan, payment, status } = req.query;

  let query = supabase
    .from('players')
    .select('id, gicl_id, first_name, last_name, middle_name, email, whatsapp, dob, plan, payment_status, city, zip_code, profile_photo_url, aadhar_url')
    .order('created_at', { ascending: false });

  if (search)  query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,gicl_id.ilike.%${search}%`);
  if (plan)    query = query.eq('plan', plan);
  if (payment) query = query.eq('payment_status', payment);
  if (status)  query = query.eq('status', status);

  const { data: players, error } = await query;
  if (error) throw new Error('Failed to fetch players for export: ' + error.message);

  const templatePath = path.join(__dirname, '..', '..', 'assets', 'JWS_2026_Players.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  const worksheet = workbook.worksheets[0];

  // Clean all existing data rows starting from the bottom down to row 2
  const rowCount = worksheet.rowCount;
  if (rowCount >= 2) {
    worksheet.spliceRows(2, rowCount - 1);
  }

  const now = new Date();
  players.forEach((p) => {
    let age = '';
    if (p.dob) {
      const birthDate = new Date(p.dob);
      let calculatedAge = now.getFullYear() - birthDate.getFullYear();
      const m = now.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      age = calculatedAge;
    }

    const rowValues = [
      p.gicl_id || '',
      p.first_name || '',
      p.middle_name || '',
      p.last_name || '',
      p.dob || '',
      age,
      p.whatsapp || '',
      p.city || '',
      p.zip_code || '',
      p.profile_photo_url || '',
      p.aadhar_url || '',
    ];

    const newRow = worksheet.addRow(rowValues);
    newRow.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'D3D3D3' } },
        left: { style: 'thin', color: { argb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'D3D3D3' } },
        right: { style: 'thin', color: { argb: 'D3D3D3' } }
      };
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=JWS_2026_Players.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

// ─── GET /api/admin/players/:id ───────────────────────────────────
exports.getPlayerDetail = asyncHandler(async (req, res) => {
  const { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !player) return res.status(404).json({ success: false, message: 'Player not found.' });
  delete player.password_hash;

  res.json({ success: true, player });
});

// ─── PUT /api/admin/players/:id/status ───────────────────────────
exports.updatePlayerStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const { error } = await supabase.from('players').update({ status, status_reason: reason || '' }).eq('id', req.params.id);
  if (error) {
    if (error.message?.includes('column') && error.message?.includes('schema cache')) {
      return res.status(400).json({
        success: false,
        message: `Database column 'status' or 'status_reason' is missing. Please run the SQL migration.`
      });
    }
    throw new Error(error.message);
  }
  res.json({ success: true, message: `Player status updated to ${status}.` });
});

// ─── PUT /api/admin/players/:id ──────────────────────────────────
exports.updatePlayer = asyncHandler(async (req, res) => {
  // Extract all updatable fields from req.body
  const updatableFields = [
    'first_name', 'last_name', 'email', 'phone', 'whatsapp', 'dob',
    'gender', 'blood_group', 'emergency_contact', 'emergency_contact_name', 'parent_name',
    'address_line1', 'address_line2', 'city', 'district', 'state', 'country', 'zip_code',
    'jersey_size', 'jersey_name', 'batting_style', 'bowling_style', 'height', 'weight',
    'balls_selected', 'field_positions',
    'player_tier', 'docs_approved'
  ];
  
  const payload = {};
  for (const field of updatableFields) {
    if (req.body[field] !== undefined) {
      payload[field] = req.body[field];
    }
  }

  const { error } = await supabase.from('players').update(payload).eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Player details updated successfully.' });
});

// ─── PUT /api/admin/players/:id/approve-docs ─────────────────────
exports.approveDocs = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('players').update({ docs_approved: true }).eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Documents approved.' });
});

// ─── PUT /api/admin/players/:id/assign-coach ─────────────────────
exports.assignCoach = asyncHandler(async (req, res) => {
  const { coachId } = req.body;
  const playerId = req.params.id;

  const { error, data: player } = await supabase
    .from('players')
    .update({ allocated_coach_id: coachId || null })
    .eq('id', playerId)
    .select('first_name, last_name, gicl_id')
    .single();

  if (error) throw new Error(error.message);

  if (coachId) {
    const playerName = `${player?.first_name || ''} ${player?.last_name || ''}`.trim();
    
    // Notify Coach
    await createNotification(coachId, 'coach', 'Player Allotted', `Player ${playerName} (${player?.gicl_id}) has been assigned to you.`, 'assignment');
    
    // Fetch coach name and Notify Player
    const { data: coach } = await supabase.from('coaches').select('first_name, last_name').eq('id', coachId).single();
    if (coach) {
      const coachName = `${coach.first_name || ''} ${coach.last_name || ''}`.trim();
      await createNotification(playerId, 'player', 'Coach Assigned', `Coach ${coachName} has been allotted to you.`, 'assignment');
    }
  }

  res.json({ success: true, message: 'Coach assigned.' });
});

// ─── GET /api/admin/payments ──────────────────────────────────────
exports.getPayments = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('players')
    .select('id, gicl_id, first_name, last_name, email, plan, payment_status, payment_id, payment_order_id, created_at')
    .not('payment_status', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  res.json({ success: true, payments: data || [] });
});

// ─── GET /api/admin/referrals (not used in JWS) ──────────────────────
exports.getReferrals = asyncHandler(async (req, res) => {
  res.json({ success: true, referrals: [] });
});

// ─── GET /api/admin/cashouts (not used in JWS) ───────────────────────
exports.getCashouts = asyncHandler(async (req, res) => {
  res.json({ success: true, cashouts: [] });
});

// ─── PUT /api/admin/cashouts/:id/approve (not used in JWS) ──────────
exports.approveCashout = asyncHandler(async (req, res) => {
  res.status(404).json({ success: false, message: 'Cashouts not available in JWS.' });
});

// ─── PUT /api/admin/cashouts/:id/reject (not used in JWS) ───────────
exports.rejectCashout = asyncHandler(async (req, res) => {
  res.status(404).json({ success: false, message: 'Cashouts not available in JWS.' });
});

// ─── Coaches CRUD ─────────────────────────────────────────────────
exports.getCoaches = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('coaches')
    .select('id, first_name, middle_name, last_name, email, whatsapp, gicl_id, status, created_at, aadhar_url, docs_approved, experience, cricket_history, coaching_history, zip_code, location, max_squad_size')
    .order('created_at', { ascending: false });
  res.json({ success: true, coaches: data || [] });
});

exports.createCoach = asyncHandler(async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { generateCoachGiclId } = require('../utils/giclId');
  const {
    firstName, lastName, email, whatsapp, password,
    dob, gender, bloodGroup, emergencyContact, emergencyContactName,
    addressLine1, addressLine2, city, country, zipCode, stateCode,
    battingStyle, bowlingStyle, jerseySize, instagramLink,
    cricketHistory, coachingHistory,
    profilePhotoUrl,
  } = req.body;

  const password_hash = await bcrypt.hash(password || 'GICL@Coach123', 12);
  const gicl_id = await generateCoachGiclId(zipCode);

  const insertData = {
    first_name: firstName,
    last_name: lastName,
    email,
    whatsapp,
    password_hash,
    role: 'coach',
    status: 'Active',
    gicl_id,
  };

  if (dob)                    insertData.dob                    = dob;
  if (gender)                 insertData.gender                 = gender;
  if (bloodGroup)             insertData.blood_group            = bloodGroup;
  if (emergencyContact)       insertData.emergency_contact      = emergencyContact;
  if (emergencyContactName)   insertData.emergency_contact_name = emergencyContactName;
  if (addressLine1)           insertData.address_line1          = addressLine1;
  if (addressLine2)           insertData.address_line2          = addressLine2;
  if (city)                   insertData.city                   = city;
  if (country)                insertData.country                = country;
  if (zipCode)                insertData.zip_code               = zipCode;
  if (stateCode)              insertData.state_code             = stateCode;
  if (battingStyle)           insertData.batting_style          = battingStyle;
  if (bowlingStyle)           insertData.bowling_style          = bowlingStyle;
  if (jerseySize)             insertData.jersey_size            = jerseySize;
  if (instagramLink)          insertData.instagram_link         = instagramLink;
  if (cricketHistory)         insertData.cricket_history        = cricketHistory;
  if (coachingHistory)        insertData.coaching_history       = coachingHistory;
  if (profilePhotoUrl)        insertData.profile_photo_url      = profilePhotoUrl;

  const { data, error } = await supabase.from('coaches').insert(insertData).select().single();
  if (error) throw new Error('Failed to create coach: ' + error.message);
  res.status(201).json({ success: true, message: 'Coach created.', coach: data });
});

exports.updateCoach = asyncHandler(async (req, res) => {
  const bcrypt = require('bcryptjs');
  const {
    firstName, lastName, whatsapp, status, password,
    dob, gender, bloodGroup, emergencyContact, emergencyContactName,
    addressLine1, addressLine2, city, country, zipCode, stateCode,
    battingStyle, bowlingStyle, jerseySize, instagramLink,
    cricketHistory, coachingHistory,
    profilePhotoUrl,
  } = req.body;

  const updateData = {};
  if (firstName !== undefined)           updateData.first_name             = firstName;
  if (lastName  !== undefined)           updateData.last_name              = lastName;
  if (whatsapp  !== undefined)           updateData.whatsapp               = whatsapp;
  if (status    !== undefined)           updateData.status                 = status;
  if (dob       !== undefined)           updateData.dob                    = dob;
  if (gender    !== undefined)           updateData.gender                 = gender;
  if (bloodGroup !== undefined)          updateData.blood_group            = bloodGroup;
  if (emergencyContact !== undefined)    updateData.emergency_contact      = emergencyContact;
  if (emergencyContactName !== undefined)updateData.emergency_contact_name = emergencyContactName;
  if (addressLine1 !== undefined)        updateData.address_line1          = addressLine1;
  if (addressLine2 !== undefined)        updateData.address_line2          = addressLine2;
  if (city !== undefined)                updateData.city                   = city;
  if (country !== undefined)             updateData.country                = country;
  if (zipCode !== undefined)             updateData.zip_code               = zipCode;
  if (stateCode !== undefined)           updateData.state_code             = stateCode;
  if (battingStyle !== undefined)        updateData.batting_style          = battingStyle;
  if (bowlingStyle !== undefined)        updateData.bowling_style          = bowlingStyle;
  if (jerseySize !== undefined)          updateData.jersey_size            = jerseySize;
  if (instagramLink !== undefined)       updateData.instagram_link         = instagramLink;
  if (cricketHistory !== undefined)      updateData.cricket_history        = cricketHistory;
  if (coachingHistory !== undefined)     updateData.coaching_history       = coachingHistory;
  if (profilePhotoUrl !== undefined)     updateData.profile_photo_url      = profilePhotoUrl;
  if (password)                          updateData.password_hash          = await bcrypt.hash(password, 12);

  const { error } = await supabase.from('coaches').update(updateData).eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Coach updated.' });
});

exports.deleteCoach = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('coaches').delete().eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Coach deleted.' });
});


// ─── Matches CRUD ─────────────────────────────────────────────────
// Map 'title' column → also expose as 'title' for frontend
exports.getMatches = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('matches').select('*').order('date', { ascending: true });
  res.json({ success: true, matches: data || [] });
});

const googleCalendar = require('../services/googleCalendar');

exports.createMatch = asyncHandler(async (req, res) => {
  const { title, date, venue, description, rules, match_type = 'Practice', age_category = 'Open (All Ages)', price_per_slot = 0, total_slots = 0 } = req.body;

  // Create Google Calendar event
  let google_event_id = null;
  if (date) {
    const start = new Date(date);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    google_event_id = await googleCalendar.insertEvent({
      summary: `${match_type.toUpperCase()}: ${title}`,
      description: description || `Venue: ${venue}.`,
      location: venue,
      start,
      end
    });
  }

  const insertData = {
    title,
    venue, location: venue,
    description, rules,
    match_type, type: match_type,
    age_category,
    price_per_slot, total_slots, google_event_id
  };
  if (date && date.trim() !== '') {
    insertData.date = date;
  }

  const { data, error } = await supabase.from('matches')
    .insert(insertData)
    .select().single();

  if (error) throw new Error('Failed to create match: ' + error.message);
  res.status(201).json({ success: true, message: 'Match scheduled.', match: data });
});

exports.updateMatch = asyncHandler(async (req, res) => {
  const { title, date, venue, description, rules, result, match_type, age_category, price_per_slot, total_slots } = req.body;
  const updateData = {};
  if (title !== undefined)        { updateData.title = title; }
  if (date !== undefined)         { updateData.date = (date && date.trim() !== '') ? date : null; }
  if (venue !== undefined)        { updateData.venue = venue; updateData.location = venue; }
  if (description !== undefined)  { updateData.description = description; }
  if (rules !== undefined)        { updateData.rules = rules; }
  if (result !== undefined)       { updateData.result = result; }
  if (match_type !== undefined)   { updateData.match_type = match_type; updateData.type = match_type; }
  if (age_category !== undefined) { updateData.age_category = age_category; }
  if (price_per_slot !== undefined) updateData.price_per_slot = price_per_slot;
  if (total_slots !== undefined)    updateData.total_slots = total_slots;

  const { error } = await supabase.from('matches').update(updateData).eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Match updated.' });
});

exports.deleteMatch = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('matches').select('google_event_id').eq('id', req.params.id).single();
  if (data?.google_event_id) {
    await googleCalendar.deleteEvent(data.google_event_id);
  }
  const { error } = await supabase.from('matches').delete().eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Match deleted.' });
});

// ─── Squad Submissions ────────────────────────────────────────────
exports.getMatchSquads = asyncHandler(async (req, res) => {
  const matchId = req.params.id;

  // Get match info
  const { data: match } = await supabase.from('matches')
    .select('id, title, total_slots, booked_slots')
    .eq('id', matchId).maybeSingle();

  // Get squads — no join, just raw data
  const { data: squads, error } = await supabase.from('coach_match_squads')
    .select('id, coach_id, player_ids, status, created_at, approved_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getMatchSquads] error:', error.message);
    return res.json({ success: true, match, squads: [] });
  }

  // Collect all unique coach_ids and player_ids
  const coachIds  = [...new Set((squads || []).map(s => s.coach_id).filter(Boolean))];
  const playerIds = [...new Set((squads || []).flatMap(s => s.player_ids || []).filter(Boolean))];

  // Fetch coaches in one query
  const { data: coaches } = coachIds.length > 0
    ? await supabase.from('coaches').select('id, first_name, last_name, email, gicl_id').in('id', coachIds)
    : { data: [] };

  // Fetch players in one query
  const { data: players } = playerIds.length > 0
    ? await supabase.from('players').select('id, first_name, last_name, gicl_id').in('id', playerIds)
    : { data: [] };

  const coachMap  = Object.fromEntries((coaches  || []).map(c => [c.id, c]));
  const playerMap = Object.fromEntries((players  || []).map(p => [p.id, p]));

  const enriched = (squads || []).map(sq => ({
    ...sq,
    coach:   coachMap[sq.coach_id]  || { first_name: 'Unknown', last_name: 'Coach' },
    players: (sq.player_ids || []).map(pid => playerMap[pid]).filter(Boolean),
  }));

  res.json({ success: true, match, squads: enriched });
});

exports.approveSquad = asyncHandler(async (req, res) => {
  const { squadId } = req.params;

  // Get the squad
  const { data: squad, error: sqErr } = await supabase.from('coach_match_squads')
    .select('*').eq('id', squadId).single();
  if (sqErr || !squad) throw new Error('Squad not found.');

  // Get the match to check slots
  const { data: match } = await supabase.from('matches')
    .select('id, total_slots, booked_slots').eq('id', squad.match_id).single();

  const currentBooked = match?.booked_slots || 0;
  const totalSlots    = match?.total_slots || 0;
  const newPlayers    = (squad.player_ids || []).length;

  if (totalSlots > 0 && currentBooked + newPlayers > totalSlots) {
    return res.status(400).json({
      success: false,
      message: `Not enough slots. Only ${totalSlots - currentBooked} slots remaining.`
    });
  }

  // Approve the squad
  await supabase.from('coach_match_squads')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', squadId);

  // Increment booked_slots on the match
  await supabase.from('matches')
    .update({ booked_slots: currentBooked + newPlayers })
    .eq('id', squad.match_id);

  res.json({ success: true, message: 'Squad approved. Slots updated.' });
});

exports.rejectSquad = asyncHandler(async (req, res) => {
  const { squadId } = req.params;
  const { error } = await supabase.from('coach_match_squads')
    .update({ status: 'rejected' }).eq('id', squadId);
  if (error) throw new Error(error.message);
  res.json({ success: true, message: 'Squad rejected.' });
});

// ─── Training Slots ───────────────────────────────────────────────
const { sendEmail } = require('../config/brevo');

exports.getTrainingSlots = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('training_slots')
    .select(`
      *,
      coach:coach_id (first_name, last_name, email, gicl_id)
    `)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  res.json({ success: true, slots: data || [] });
});

exports.approveTrainingSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('training_slots')
    .update({ status: 'approved' })
    .eq('id', id)
    .select('*, coach:coach_id (email, first_name)').single();
  if (error) throw new Error(error.message);

  if (data?.coach?.email) {
    await sendEmail(
      data.coach.email,
      'Training Slot Approved',
      `<p>Hi ${data.coach.first_name},</p><p>Your training slot for ${data.training_type} on ${new Date(data.scheduled_time).toLocaleString()} has been approved.</p>`
    );
  }

  res.json({ success: true, message: 'Training slot approved.', slot: data });
});

exports.rejectTrainingSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('training_slots')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select('*, coach:coach_id (email, first_name)').single();
  if (error) throw new Error(error.message);

  if (data?.coach?.email) {
    await sendEmail(
      data.coach.email,
      'Training Slot Rejected',
      `<p>Hi ${data.coach.first_name},</p><p>Your training slot for ${data.training_type} on ${new Date(data.scheduled_time).toLocaleString()} has been rejected. Please contact administration for details.</p>`
    );
  }

  res.json({ success: true, message: 'Training slot rejected.', slot: data });
});

// ─── App Config ───────────────────────────────────────────────────
exports.getConfig = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single();
  if (error) throw new Error(error.message);
  res.json({ success: true, config: data });
});

exports.updateConfig = asyncHandler(async (req, res) => {
  const allowed = [
    'plans', 'jersey_sizes', 'batting_styles', 'bowling_styles', 'ball_types',
    'age_groups', 'clubs', 'referral_level1', 'referral_level2', 'referral_level3plus',
    'referral_level1_name', 'referral_level2_name', 'referral_level3plus_name',
    'referral_level1_active', 'referral_level2_active', 'referral_level3plus_active',
    'referral_min_cashout', 'max_squad_size', 'match_team_size',
    'banners', 'ad_banners', 'landing_bg_image', 'registration_terms',
    'basic_training_videos', 'advance_training_fee', 'app_logo_url',
    'jersey_measure_url', 'kids_jersey_measure_urls', 'adults_jersey_measure_urls'
  ];
  const updateData = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updateData[key] = req.body[key];
    }
  }
  if (Object.keys(updateData).length === 0) return res.status(400).json({ success: false, message: 'No valid fields.' });

  const { error } = await supabase.from('app_config').update(updateData).eq('id', 1);

  if (error) {
    // Detect missing column errors — give a clear actionable message
    if (error.message?.includes('column') && error.message?.includes('schema cache')) {
      const colMatch = error.message.match(/'([^']+)' column/);
      const colName = colMatch ? colMatch[1] : 'unknown';
      let sqlType = "text DEFAULT ''";
      if (colName.endsWith('_urls')) sqlType = "jsonb DEFAULT '[]'::jsonb";
      return res.status(400).json({
        success: false,
        message: `Database column '${colName}' is missing. Please run this SQL in Supabase → SQL Editor:\n\nALTER TABLE app_config ADD COLUMN IF NOT EXISTS ${colName} ${sqlType};`,
      });
    }
    throw new Error(error.message);
  }

  res.json({ success: true, message: 'Config updated.' });
});


// ─── Coach Video Uploads (not used in JWS) ───────────────────────

exports.listCoachUploads = asyncHandler(async (req, res) => {
  res.json({ success: true, uploads: [] });
});

exports.approveCoachUpload = asyncHandler(async (req, res) => {
  res.status(404).json({ success: false, message: 'Not available in JWS.' });
});

// PUT /api/admin/coach-uploads/:id/reject
exports.rejectCoachUpload = asyncHandler(async (req, res) => {
  res.status(404).json({ success: false, message: 'Not available in JWS.' });
});

// ─── Upload banner image (dashboard banners / landing bg) ─────────────────
exports.uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const ext = req.file.mimetype.split('/')[1];
  const path = `banners/${Date.now()}.${ext}`;
  const { error: uploadError } = await sb.storage.from('banners').upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data: { publicUrl } } = sb.storage.from('banners').getPublicUrl(path);
  res.json({ success: true, url: publicUrl });
});

// ─── Upload Jersey Measure image ──────────────────────────────────────────
exports.uploadJerseyMeasure = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const ext = req.file.mimetype.split('/')[1];
  const path = `assets/jersey_measure_${Date.now()}.${ext}`;
  const { error: uploadError } = await sb.storage.from('banners').upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data: { publicUrl } } = sb.storage.from('banners').getPublicUrl(path);
  res.json({ success: true, url: publicUrl });
});

// ─── Upload ad-banner image ───────────────────────────────────────────────
exports.uploadAdBanner = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const ext = req.file.mimetype.split('/')[1];
  const path = `ad-banners/${Date.now()}.${ext}`;
  const { error: uploadError } = await sb.storage.from('ad-banners').upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data: { publicUrl } } = sb.storage.from('ad-banners').getPublicUrl(path);
  res.json({ success: true, url: publicUrl });
});

// ─── Upload App Logo (Admin) ────────────────────────────────────────────────
exports.uploadAppLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const ext = req.file.mimetype.split('/')[1];
  const path = `app_logo_${Date.now()}.${ext}`;
  const { error: uploadError } = await sb.storage.from('banners').upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data: { publicUrl } } = sb.storage.from('banners').getPublicUrl(path);
  res.json({ success: true, url: publicUrl });
});

// ─── Upload sponsor logo (sidebar) ─────────────────────────────────────────
exports.uploadSponsorLogo = asyncHandler(async (req, res) => {
  const { slot } = req.params; // '1' or '2'
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Use a fixed name so the frontend can just fetch this static URL
  // We use .png to keep it simple, but we can just name it sponsor-[slot] without extension
  // However, it's safer to use an extension so the browser sets the correct mime type
  const path = `sponsor-${slot}.png`;
  
  const { error: uploadError } = await sb.storage.from('banners').upload(path, req.file.buffer, { 
    contentType: req.file.mimetype, 
    upsert: true 
  });
  
  if (uploadError) throw new Error(uploadError.message);
  
  const { data: { publicUrl } } = sb.storage.from('banners').getPublicUrl(path);
  res.json({ success: true, url: `${publicUrl}?t=${Date.now()}` }); // Cache buster
});

// ─── Upload Player ID Card (Admin) ─────────────────────────────────────────
exports.uploadPlayerIdCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const ext = req.file.mimetype.split('/')[1] || 'pdf';
  const path = `player_${id}_${Date.now()}.${ext}`;
  
  const { error: uploadError } = await sb.storage.from('documents').upload(path, req.file.buffer, { 
    contentType: req.file.mimetype, 
    upsert: true 
  });
  
  if (uploadError) throw new Error(uploadError.message);
  
  // Documents is a private bucket, so getPublicUrl doesn't work. We must use a long-lived signed URL.
  const { data: { signedUrl }, error: signError } = await sb.storage
    .from('documents')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
    
  if (signError) throw new Error(signError.message);
  
  // Update the player record
  const { error: updateError } = await sb
    .from('players')
    .update({ manual_id_card_url: signedUrl })
    .eq('id', id);
    
  if (updateError) throw new Error(updateError.message);
  
  res.json({ success: true, url: signedUrl });
});

exports.uploadCoachDocument = asyncHandler(async (req, res) => {
  const { id, type } = req.params;
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  if (!['birth_cert', 'address_proof'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid document type.' });

  const path = `coaches/${id}/${type}_${Date.now()}`;
  const { error: uploadError } = await sb.storage.from('documents').upload(path, req.file.buffer, { 
    contentType: req.file.mimetype, upsert: true 
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrlData } = sb.storage.from('documents').getPublicUrl(path);

  const updateData = {};
  if (type === 'birth_cert') updateData.birth_cert_url = publicUrlData.publicUrl;
  if (type === 'address_proof') updateData.address_proof_url = publicUrlData.publicUrl;

  const { error: updateError } = await sb.from('coaches').update(updateData).eq('id', id);
  if (updateError) throw new Error(updateError.message);

  res.json({ success: true, url: publicUrlData.publicUrl });
});
