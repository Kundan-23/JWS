-- Add missing foreign key constraint between cashout_requests and players
ALTER TABLE cashout_requests 
  ADD CONSTRAINT cashout_requests_player_id_fkey 
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Also tell PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
