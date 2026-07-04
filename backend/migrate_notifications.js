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

async function migrate() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      user_type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      type text NOT NULL,
      link text,
      is_read boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, user_type)`,
    `ALTER TABLE notifications REPLICA IDENTITY FULL`
  ];

  for (const sql of statements) {
    const r = await runSQL(sql);
    if (r.status === 200 || r.status === 204) {
      console.log('✅', sql.slice(0, 60));
    } else {
      console.log('❌', sql.slice(0, 60), r.status, r.data);
    }
  }
}

migrate();
