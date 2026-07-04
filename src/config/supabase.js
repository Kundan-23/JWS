import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Realtime notifications may not work.');
}

const supabase = createClient(
  supabaseUrl || 'https://qrgwmahlngkmebtwntha.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3dtYWhsbmdrbWVidHdudGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mjc0NDEsImV4cCI6MjA5NjMwMzQ0MX0.aoJlPOXoXN7ZbySkd_wzgtfGWixlyfDlZKBWe_Xr_W4'
);

export default supabase;
