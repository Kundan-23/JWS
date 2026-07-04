const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = require('./src/config/supabase');

async function run() {
  const { data: coach } = await supabase.from('coaches').select('id').limit(1).single();
  const { data: player } = await supabase.from('players').select('id').limit(1).single();
  
  const { error } = await supabase.from('referrals').insert({
    referrer_id: coach.id,
    referred_id: player.id,
    amount_earned: 50,
    level: 1
  });
  console.log('Insert referrals error:', error);
}
run();
