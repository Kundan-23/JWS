/**
 * createTestPlayer.js
 * One-time script: creates a test player account in Supabase players table.
 * Sets payment_status = 'paid' without creating payment logs or sequence IDs.
 *
 * Usage: node backend/src/scripts/createTestPlayer.js <email> <password> [unlocked]
 * Example: node backend/src/scripts/createTestPlayer.js jwstester2026@gmail.com Tester@2026; true
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt       = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const EMAIL    = process.argv[2] || 'jwstester2026@gmail.com';
const PASSWORD = process.argv[3] || 'Tester@2026;';
const UNLOCKED = process.argv[4] === 'true'; // Set true to bypass Step 4/Step 5 onboarding entirely

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if player already exists
  const { data: existing } = await supabase
    .from('players')
    .select('id, email')
    .eq('email', EMAIL)
    .maybeSingle();

  if (existing) {
    console.log(`ℹ️  Player already exists: ${EMAIL} (id: ${existing.id})`);
    console.log('   Updating credentials and setting payment_status = paid...');
    
    const password_hash = await bcrypt.hash(PASSWORD, 12);
    const updateData = {
      password_hash,
      payment_status: 'paid',
      plan: 'p1',
      is_dashboard_unlocked: UNLOCKED
    };
    
    // If bypassing onboarding, also populate dummy details to bypass checks
    if (UNLOCKED) {
      updateData.gicl_id = 'JWS_TEST_USER';
      updateData.first_name = 'JWS';
      updateData.last_name = 'Tester';
      updateData.batting_style = 'Right-hand bat';
      updateData.bowling_style = 'Right-arm medium';
      updateData.height = 175;
      updateData.weight = 70;
    }

    const { error } = await supabase
      .from('players')
      .update(updateData)
      .eq('email', EMAIL);

    if (error) throw error;
    console.log('✅ Account updated successfully.');
    return;
  }

  // Hash password and insert
  const password_hash = await bcrypt.hash(PASSWORD, 12);
  const insertData = {
    email: EMAIL,
    password_hash,
    role: 'player',
    payment_status: 'paid',
    plan: 'p1',
    is_dashboard_unlocked: UNLOCKED
  };

  // If bypassing onboarding, also populate dummy details to bypass checks
  if (UNLOCKED) {
    insertData.gicl_id = 'JWS_TEST_USER';
    insertData.first_name = 'JWS';
    insertData.last_name = 'Tester';
    insertData.batting_style = 'Right-hand bat';
    insertData.bowling_style = 'Right-arm medium';
    insertData.height = 175;
    insertData.weight = 70;
  }

  const { data, error } = await supabase
    .from('players')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  console.log(`✅ Created test player account: ${EMAIL}`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Onboarding Bypassed: ${UNLOCKED}`);
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
