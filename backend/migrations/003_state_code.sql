-- Migration 003: Add state_code column to players
-- Run this in Supabase SQL Editor → New Query

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS state_code TEXT;

-- Add index for potential state-based queries
CREATE INDEX IF NOT EXISTS idx_players_state_code ON players(state_code);

-- Optionally back-fill existing players with a placeholder
-- (Admin can fix individual wrong IDs via the dashboard)
-- UPDATE players SET state_code = 'IN' WHERE state_code IS NULL;
