const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/player/training ──────────────────────────────
exports.getTrainingData = asyncHandler(async (req, res) => {
  // 1. Get basic training videos & advance fee from config
  const { data: config } = await supabase
    .from('app_config')
    .select('basic_training_videos, advance_training_fee')
    .eq('id', 1)
    .single();

  // 2. Get player's progress
  const { data: player } = await supabase
    .from('players')
    .select('training_progress, has_unlocked_advance_training, is_dashboard_unlocked, training_attempt_status, allocated_coach_id')
    .eq('id', req.user.id)
    .single();

  let advance_videos = [];
  if (player?.has_unlocked_advance_training) {
    const { data: vids } = await supabase
      .from('coach_video_uploads')
      .select('id, title, url, status, coach_id')
      .eq('status', 'approved');
    advance_videos = vids || [];
  }

  res.json({
    success: true,
    basic_training_videos: config?.basic_training_videos || [],
    advance_training_fee: config?.advance_training_fee || 499,
    training_progress: player?.training_progress || [],
    has_unlocked_advance_training: player?.has_unlocked_advance_training || false,
    is_dashboard_unlocked: player?.is_dashboard_unlocked || false,
    advance_videos,
    training_attempt_status: player?.training_attempt_status || null,
    allocated_coach_id: player?.allocated_coach_id || null
  });
});

// ─── POST /api/player/training/watch ───────────────────────
exports.markVideoWatched = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ success: false, message: 'Video ID required' });

  // Fetch current progress
  const { data: player } = await supabase
    .from('players')
    .select('training_progress')
    .eq('id', req.user.id)
    .single();

  const progress = player?.training_progress || [];
  if (!progress.includes(videoId)) {
    progress.push(videoId);
    await supabase.from('players').update({ training_progress: progress }).eq('id', req.user.id);
  }

  res.json({ success: true, message: 'Progress saved.', training_progress: progress });
});

// ─── POST /api/player/training/submit-attempt ──────────────
exports.submitAttempt = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url || url.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Valid attempt URL is required.' });
  }

  // Check if all basic videos watched
  const { data: config } = await supabase.from('app_config').select('basic_training_videos').eq('id', 1).single();
  const basicVideos = config?.basic_training_videos || [];
  
  const { data: player } = await supabase.from('players').select('training_progress').eq('id', req.user.id).single();
  const progress = player?.training_progress || [];

  const allWatched = basicVideos.every(v => progress.includes(v.id));
  if (!allWatched) {
    return res.status(400).json({ success: false, message: 'You must watch all basic training videos first.' });
  }

  // Update player
  await supabase
    .from('players')
    .update({ 
      training_attempt_url: url.trim(),
      training_attempt_status: 'Pending'
      // is_dashboard_unlocked is NO LONGER set to true here. Coach will approve it.
    })
    .eq('id', req.user.id);

  res.json({ success: true, message: 'Attempt submitted! Pending coach approval.' });
});
