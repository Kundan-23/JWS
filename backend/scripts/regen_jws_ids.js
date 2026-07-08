/**
 * ONE-TIME MIGRATION SCRIPT
 * Regenerates all existing player JWS IDs to the new 8-digit padded format.
 *
 * OLD format: JWS00002072026MH   (5-digit seq + month + year + state)
 * NEW format: JWS00000002072026MH (8-digit seq + month + year + state)
 *
 * Run on VPS: node /var/www/jws/backend/scripts/regen_jws_ids.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabase } = require('../src/config/supabase');

// New format: JWS(3) + seq8(8) + month(2) + year(4) + state(2) = 19 chars
const NEW_ID_LEN = 19;

function parseOldId(giclId) {
  const body    = giclId.slice(3);               // strip "JWS"
  const state   = body.slice(-2);                // last 2 = state
  const datepart = body.slice(-8, -2);           // 6 chars before state = mmyyyy
  const month   = datepart.slice(0, 2);
  const year    = datepart.slice(2);
  const seqStr  = body.slice(0, body.length - 8);
  const seq     = parseInt(seqStr, 10);
  return { seq, month, year, state };
}

async function main() {
  console.log('Fetching all players with existing JWS IDs...\n');

  const { data: players, error } = await supabase
    .from('players')
    .select('id, email, gicl_id')
    .not('gicl_id', 'is', null);

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  console.log('Found ' + players.length + ' player(s) with JWS IDs:\n');
  players.forEach(p => console.log('  ' + p.gicl_id + '  ->  ' + p.email));

  const toUpdate = players.filter(p => p.gicl_id && p.gicl_id.length < NEW_ID_LEN);

  if (toUpdate.length === 0) {
    console.log('\nAll IDs already in new 8-digit format. Nothing to do.');
    process.exit(0);
  }

  console.log('\n' + toUpdate.length + ' ID(s) need migration:\n');

  for (const player of toUpdate) {
    const old = player.gicl_id;
    let newId;
    try {
      const { seq, month, year, state } = parseOldId(old);
      newId = 'JWS' + String(seq).padStart(8, '0') + month + year + state;
    } catch (e) {
      console.log('  SKIP (could not parse): ' + old);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('players').update({ gicl_id: newId }).eq('id', player.id);

    if (updateErr) {
      console.log('  FAIL ' + player.email + ': ' + updateErr.message);
    } else {
      console.log('  OK  ' + old + '  ->  ' + newId + '  (' + player.email + ')');
    }
  }

  console.log('\nMigration complete!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
