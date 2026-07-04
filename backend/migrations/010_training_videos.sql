-- Migration 010: Mandatory Training Videos Workflow

-- 1. Add fields to app_config
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS basic_training_videos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS advance_training_fee numeric DEFAULT 499;

-- 2. Add fields to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS training_progress jsonb DEFAULT '[]'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS training_attempt_url text DEFAULT '';
ALTER TABLE players ADD COLUMN IF NOT EXISTS has_unlocked_advance_training boolean DEFAULT false;
