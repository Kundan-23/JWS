const supabase     = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

exports.getPublicConfig = asyncHandler(async (req, res) => {
  const { data: raw, error } = await supabase
    .from('app_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw new Error('Failed to load config: ' + error.message);

  // Shape a clean, safe config object for frontend consumption
  // Using optional chaining so missing columns never crash the endpoint
  const config = {
    age_groups:     raw.age_groups     || [],
    jersey_sizes:   raw.jersey_sizes   || [],
    batting_styles: raw.batting_styles || [],
    bowling_styles: raw.bowling_styles || [],
    clubs:          raw.clubs          || [],
    // Normalize ball_types: legacy strings → { name, imageUrl: '' }
    ball_types: (raw.ball_types || []).map(b =>
      typeof b === 'string' ? { name: b, imageUrl: '' } : b
    ),
    plans:      raw.plans     || [],
    banners:    raw.banners   || [],
    ad_banners: raw.ad_banners || [],
    landing_bg_image:   raw.landing_bg_image   || '',
    registration_terms: raw.registration_terms || '',
    app_logo_url:       raw.app_logo_url       || '',
    jersey_measure_url: raw.jersey_measure_url || '',
    kids_jersey_measure_urls: raw.kids_jersey_measure_urls || [],
    adults_jersey_measure_urls: raw.adults_jersey_measure_urls || [],
    referral: {
      level1:     raw.referral_level1     ?? 50,
      level2:     raw.referral_level2     ?? 20,
      level3plus: raw.referral_level3plus ?? 10,
      level1Name: raw.referral_level1_name ?? 'Level 1',
      level2Name: raw.referral_level2_name ?? 'Level 2',
      level3Name: raw.referral_level3plus_name ?? 'Level 3+',
      level1Active: raw.referral_level1_active ?? true,
      level2Active: raw.referral_level2_active ?? true,
      level3Active: raw.referral_level3plus_active ?? true,
      minCashout: raw.referral_min_cashout ?? 500,
    },
    maxSquadSize: raw.max_squad_size || 20,
    appLogoUrl: raw.app_logo_url || raw.id_card_signature_url || '',
  };

  res.json({ success: true, config });
});
