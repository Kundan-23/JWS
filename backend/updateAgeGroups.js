require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const newAgeGroups = [
  { cat: 'Juniors', sub: 'U-13', color: '#3b82f6' },
  { cat: 'Juniors', sub: 'U-17', color: '#ec4899' },
  { cat: 'Juniors', sub: 'U-22', color: '#06b6d4' },
  { cat: 'Open', sub: 'Open (All Ages)', color: '#10b981' }
];

s.from('app_config').update({ age_groups: newAgeGroups }).eq('id', 1).then(r => {
  console.log("Updated age groups successfully.");
}).catch(console.error);
