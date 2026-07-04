-- Migration 007: Add referral columns to coaches
-- Run this in Supabase SQL Editor

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_points NUMERIC DEFAULT 0;
