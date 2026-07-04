require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = new URL(SUPABASE_URL);
const host = url.hostname;

async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: host, port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Use pg directly via connection string if available, otherwise print instructions
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(SUPABASE_URL, KEY);

async function migrate() {
  const statements = [
    `ALTER TABLE app_config ADD COLUMN IF NOT EXISTS referral_level1 numeric DEFAULT 50`,
    `ALTER TABLE app_config ADD COLUMN IF NOT EXISTS referral_level2 numeric DEFAULT 20`,
    `ALTER TABLE app_config ADD COLUMN IF NOT EXISTS referral_level3plus numeric DEFAULT 10`,
    `ALTER TABLE app_config ADD COLUMN IF NOT EXISTS referral_min_cashout numeric DEFAULT 500`,
    `UPDATE app_config SET referral_level1=50, referral_level2=20, referral_level3plus=10, referral_min_cashout=500 WHERE id=1`,
    `ALTER TABLE referrals ADD COLUMN IF NOT EXISTS level integer DEFAULT 1`,
    `ALTER TABLE referrals ADD COLUMN IF NOT EXISTS amount_earned numeric DEFAULT 50`,
    `CREATE TABLE IF NOT EXISTS cashout_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE, amount numeric NOT NULL, upi_id text, bank_name text, account_no text, ifsc_code text, method text NOT NULL DEFAULT 'upi', status text NOT NULL DEFAULT 'pending', admin_note text, created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz)`,
    `CREATE INDEX IF NOT EXISTS idx_cashout_player ON cashout_requests(player_id)`,
    `CREATE INDEX IF NOT EXISTS idx_referrals_ref ON referrals(referrer_id)`,
    `ALTER TABLE app_config ADD COLUMN IF NOT EXISTS basic_training_videos jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE app_config ADD COLUMN IF NOT EXISTS advance_training_fee numeric DEFAULT 499`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS training_progress jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS training_attempt_url text DEFAULT ''`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS has_unlocked_advance_training boolean DEFAULT false`,
    `CREATE TABLE IF NOT EXISTS coach_video_uploads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE, title text NOT NULL, url text NOT NULL, duration text, status text DEFAULT 'pending', rejection_reason text, reviewed_at timestamptz, created_at timestamptz DEFAULT now())`
  ];

  for (const sql of statements) {
    const r = await runSQL(sql);
    if (r.status === 200 || r.status === 204) {
      console.log('✅', sql.slice(0, 60));
    } else {
      console.log('❌', sql.slice(0, 60));
      console.log('   Response:', r.data.slice(0, 200));
    }
  }
  console.log('\nDone.');
}

migrate().catch(console.error);
