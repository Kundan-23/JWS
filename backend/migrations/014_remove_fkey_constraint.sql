-- Remove foreign key constraints that restrict referrals to only players
-- This allows both coaches and players to act as referrers.

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_referred_by_id_fkey;
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;
