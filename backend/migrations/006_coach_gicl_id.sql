-- Migration 006: Add coach counter to app_config
-- Run this in Supabase SQL Editor

-- Add next_coach_number column to app_config (if not exists)
ALTER TABLE app_config
  ADD COLUMN IF NOT EXISTS next_coach_number INTEGER DEFAULT 1;

-- Also add gicl_id to coaches table if it wasn't added before
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS gicl_id TEXT UNIQUE;

-- Document upload columns for coaches
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS birth_cert_url TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_url TEXT;
