import('dotenv').then(dotenv => {
  dotenv.config();
  import('@supabase/supabase-js').then(supabase => {
    const client = supabase.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    client.from('coach_video_uploads').select('*').then(res => {
      console.log('Videos:', JSON.stringify(res.data, null, 2));
    });
  });
})
