const supabase = require('../config/supabase');

/**
 * Resolve a pincode → 2-char Indian state abbreviation.
 * Checks 3-digit prefix first (for disambiguation like Goa vs Maharashtra),
 * then falls back to 1-digit prefix.
 */
const PINCODE_PREFIX3_MAP = {
  '403': 'GA',  // Goa
  '110': 'DL',  // Delhi
  '201': 'UP',  // Uttar Pradesh (Noida overlap)
};

const PINCODE_PREFIX1_MAP = {
  '1': 'DL',  // Delhi / Haryana / Punjab
  '2': 'RJ',  // Rajasthan / UP (west)
  '3': 'GJ',  // Gujarat
  '4': 'MH',  // Maharashtra / MP / CG
  '5': 'AP',  // Andhra Pradesh / Telangana
  '6': 'KL',  // Kerala / TN
  '7': 'WB',  // West Bengal / Odisha / NE
  '8': 'MP',  // Madhya Pradesh / CG
  '9': 'UP',  // Uttar Pradesh / UK
};

// Legacy export for any code using the old flat map
const PINCODE_STATE_MAP = PINCODE_PREFIX1_MAP;

function resolveState(zipCode) {
  const pin = String(zipCode || '').replace(/\D/g, '');
  if (!pin) return 'IN';
  // Check 3-digit prefix first
  const prefix3 = PINCODE_PREFIX3_MAP[pin.slice(0, 3)];
  if (prefix3) return prefix3;
  // Fallback to 1-digit prefix
  return PINCODE_PREFIX1_MAP[pin[0]] || 'IN';
}

/**
 * Generate Player JWS ID in format: JWS00001062026MH
 * JWS + 5-digit-seq + 2-digit-month + 4-digit-year + 2-char-state
 * Uses atomic DB increment via Supabase RPC.
 *
 * @param {string} zipCode - Player pincode
 * @returns {Promise<{ giclId: string, registrationNumber: number }>}
 */
async function generateGiclId(zipCode) {
  const { data, error } = await supabase.rpc('increment_registration_number');
  if (error) throw new Error('Failed to generate registration number: ' + error.message);

  const seq   = String(data).padStart(5, '0');
  const now   = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = String(now.getFullYear());
  const state = resolveState(zipCode);

  const giclId = `JWS${seq}${month}${year}${state}`;
  return { giclId, registrationNumber: data };
}

/**
 * Generate Coach/Selector JWS ID in format: JWSSL0001062026GA
 * Same logic as players but:
 *   - 5-digit sequence (coach/selector counter, separate from players)
 *   - State derived from coach's pincode
 *
 * @param {string} zipCode - Coach/Selector pincode
 * @returns {Promise<string>} e.g. "JWSSL0001062026GA"
 */
async function generateCoachGiclId(zipCode) {
  // Get and increment coach counter from app_config
  const { data: cfg, error: fetchErr } = await supabase
    .from('app_config')
    .select('next_coach_number')
    .eq('id', 1)
    .single();

  if (fetchErr) throw new Error('Failed to fetch coach counter: ' + fetchErr.message);

  const seq   = String(cfg?.next_coach_number || 1).padStart(5, '0');
  const now   = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = String(now.getFullYear());
  const state = resolveState(zipCode);

  await supabase
    .from('app_config')
    .update({ next_coach_number: (cfg?.next_coach_number || 1) + 1 })
    .eq('id', 1);

  return `JWSSL${seq}${month}${year}${state}`;
}

module.exports = { generateGiclId, generateCoachGiclId, PINCODE_STATE_MAP, resolveState };
