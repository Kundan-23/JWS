-- Migration 012: Add status_reason to players and coaches

ALTER TABLE players ADD COLUMN IF NOT EXISTS status_reason text DEFAULT '';
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS status_reason text DEFAULT '';
