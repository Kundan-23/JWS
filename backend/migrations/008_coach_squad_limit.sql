-- Migration 008: Add max players per coach limit to app_config
-- Run this in Supabase SQL Editor

ALTER TABLE app_config
  ADD COLUMN IF NOT EXISTS max_players_per_coach INTEGER DEFAULT 20;
