require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('app_config').select('age_groups').single().then(r => console.log(JSON.stringify(r))).catch(console.error);
