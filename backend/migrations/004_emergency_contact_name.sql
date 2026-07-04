-- Migration 004: Add emergency_contact_name column to players
-- Run this in Supabase SQL Editor → New Query

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
