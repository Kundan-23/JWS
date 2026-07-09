/**
 * seedAdmin.js
 * One-time script: creates the read-only viewer admin account in the admins table.
 * Run from the project root: node backend/src/scripts/seedAdmin.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt       = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SALT_ROUNDS = 12;
const EMAIL       = 'jwsadmin2026@gmail.com';
const PASSWORD    = 'Admin@2026;';
const NAME        = 'Viewer Admin';

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

  // Check if already exists
  const { data: existing } = await supabase
    .from('admins')
    .select('id, email')
    .eq('email', EMAIL)
    .maybeSingle();

  if (existing) {
    console.log(`ℹ️  Admin already exists: ${EMAIL} (id: ${existing.id})`);
    console.log('   Updating password hash...');
    const password_hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    const { error } = await supabase
      .from('admins')
      .update({ password_hash, name: NAME })
      .eq('email', EMAIL);
    if (error) throw error;
    console.log('✅ Password updated successfully.');
    return;
  }

  // Hash password and insert
  const password_hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const { error } = await supabase.from('admins').insert({
    email: EMAIL,
    password_hash,
    role: 'admin',
    name: NAME,
  });

  if (error) throw error;
  console.log(`✅ Created read-only admin: ${EMAIL}`);
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
