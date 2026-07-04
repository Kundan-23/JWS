const supabase     = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

// Fetch practice matches created by Admin
exports.getPracticeMatches = asyncHandler(async (req, res) => {
  // Fetch all matches, then filter in JS (avoids PostgREST reserved-word issues with 'type' column)
  const { data, error } = await supabase.from('matches')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('[getPracticeMatches] DB error:', error.message);
    return res.json({ success: true, matches: [] });
  }

  const matches = (data || [])
    .filter(m => {
      const mt = (m.match_type || '').toLowerCase();
      const t  = (m.type || '').toLowerCase();
      return mt === 'practice' || t === 'practice';
    })
    .map(m => ({
      ...m,
      venue:      m.venue      || m.location,
      match_type: m.match_type || m.type
    }));

  res.json({ success: true, matches });
});

// Coach creates a squad for a practice match
exports.submitMatchSquad = asyncHandler(async (req, res) => {
  const { matchId, playerIds } = req.body;
  const coachId = req.user.id; // from auth middleware
  
  if (!matchId || !playerIds || !Array.isArray(playerIds)) {
    return res.status(400).json({ success: false, message: 'Invalid data.' });
  }

  const { error } = await supabase.from('coach_match_squads')
    .upsert({ match_id: matchId, coach_id: coachId, player_ids: playerIds }, { onConflict: 'match_id,coach_id' });
    
  if (error) throw new Error(error.message);
  res.status(201).json({ success: true, message: 'Squad submitted for the practice match.' });
});

// Coach submits a player training slot for approval
exports.submitTrainingSlot = asyncHandler(async (req, res) => {
  const { trainingType, scheduledTime, playerIds } = req.body;
  const coachId = req.user.id;
  
  if (!trainingType || !scheduledTime || !playerIds || !Array.isArray(playerIds)) {
    return res.status(400).json({ success: false, message: 'Invalid data.' });
  }

  const { error } = await supabase.from('training_slots')
    .insert({
      coach_id: coachId,
      training_type: trainingType,
      scheduled_time: scheduledTime,
      player_ids: playerIds,
      status: 'pending'
    });

  if (error) throw new Error(error.message);
  res.status(201).json({ success: true, message: 'Training slot submitted for approval.' });
});

// Get coach's training slots
exports.getTrainingSlots = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('training_slots')
    .select('*')
    .eq('coach_id', req.user.id)
    .order('scheduled_time', { ascending: false });
    
  if (error) throw new Error(error.message);
  res.json({ success: true, slots: data || [] });
});
