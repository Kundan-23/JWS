require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const newAgeGroups = [
  { cat: 'Juniors', sub: 'Boys U-13', color: '#3b82f6' },
  { cat: 'Juniors', sub: 'Girls U-13', color: '#8b5cf6' },
  { cat: 'Juniors', sub: 'Boys U-15', color: '#4f46e5' },
  { cat: 'Juniors', sub: 'Girls U-15', color: '#d946ef' },
  { cat: 'Juniors', sub: 'Boys U-17', color: '#0ea5e9' },
  { cat: 'Juniors', sub: 'Girls U-17', color: '#ec4899' },
  { cat: 'Juniors', sub: 'Boys U-19', color: '#0284c7' },
  { cat: 'Juniors', sub: 'Girls U-19', color: '#e11d48' },
  { cat: 'Juniors', sub: 'Boys U-22', color: '#06b6d4' },
  { cat: 'Juniors', sub: 'Girls U-22', color: '#f43f5e' },
  { cat: 'Open', sub: 'Open Male', color: '#10b981' },
  { cat: 'Open', sub: 'Open Female', color: '#14b8a6' },
  { cat: 'Masters', sub: '35+', color: '#f97316' },
  { cat: 'Masters', sub: '40+', color: '#f59e0b' },
  { cat: 'Masters', sub: '45+', color: '#ef4444' },
  { cat: 'Masters', sub: '50+', color: '#a855f7' },
  { cat: 'Masters', sub: '55+', color: '#c026d3' },
  { cat: 'Masters', sub: '60+', color: '#9333ea' },
  { cat: 'Masters', sub: '65+', color: '#61177c' }
];

s.from('app_config').update({ age_groups: newAgeGroups }).eq('id', 1).then(r => {
  console.log("Updated age groups successfully.");
}).catch(console.error);
