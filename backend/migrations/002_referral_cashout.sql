-- Migration: Referral System + Cashout Requests
-- Run this in Supabase SQL Editor

-- 1. Add referral bonus columns to app_config
ALTER TABLE app_config 
  ADD COLUMN IF NOT EXISTS referral_level1       numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS referral_level2       numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS referral_level3plus   numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS referral_min_cashout  numeric DEFAULT 500;

-- Update existing row with defaults
UPDATE app_config SET
  referral_level1      = 50,
  referral_level2      = 20,
  referral_level3plus  = 10,
  referral_min_cashout = 500
WHERE id = 1;

-- 2. Alter referrals table — add level and amount_earned
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS level         integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS amount_earned numeric DEFAULT 50;

-- 3. Create cashout_requests table
CREATE TABLE IF NOT EXISTS cashout_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount       numeric     NOT NULL CHECK (amount >= 500),
  upi_id       text,
  bank_name    text,
  account_no   text,
  ifsc_code    text,
  method       text        NOT NULL DEFAULT 'upi',   -- 'upi' | 'bank'
  status       text        NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);

-- 4. Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cashout_player   ON cashout_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_cashout_status   ON cashout_requests(status);
CREATE INDEX IF NOT EXISTS idx_referrals_ref    ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_players_referred ON players(referred_by_id);
