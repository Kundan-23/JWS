-- Migration 005: Expand coaches table to match player-level profile fields
-- Run this in Supabase SQL Editor → New Query

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS profile_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS dob                  DATE,
  ADD COLUMN IF NOT EXISTS gender               TEXT,
  ADD COLUMN IF NOT EXISTS blood_group          TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact    TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS address_line1        TEXT,
  ADD COLUMN IF NOT EXISTS address_line2        TEXT,
  ADD COLUMN IF NOT EXISTS city                 TEXT,
  ADD COLUMN IF NOT EXISTS state_code           TEXT,
  ADD COLUMN IF NOT EXISTS country              TEXT,
  ADD COLUMN IF NOT EXISTS zip_code             TEXT,
  ADD COLUMN IF NOT EXISTS batting_style        TEXT,
  ADD COLUMN IF NOT EXISTS bowling_style        TEXT,
  ADD COLUMN IF NOT EXISTS jersey_size          TEXT,
  ADD COLUMN IF NOT EXISTS instagram_link       TEXT,
  ADD COLUMN IF NOT EXISTS cricket_history      TEXT,
  ADD COLUMN IF NOT EXISTS coaching_history     TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_phone    TEXT,
  ADD COLUMN IF NOT EXISTS teams                JSONB DEFAULT '[]'::jsonb;
