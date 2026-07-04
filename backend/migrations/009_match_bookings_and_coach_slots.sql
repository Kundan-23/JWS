-- Migration 009: Add Match Bookings and Coach Slots functionality
-- Run this in Supabase SQL Editor

-- 1. Modify matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_type VARCHAR DEFAULT 'tournament',
  ADD COLUMN IF NOT EXISTS price_per_slot NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_slots INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booked_slots INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- 2. Create training_slots table
CREATE TABLE IF NOT EXISTS training_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  training_type VARCHAR NOT NULL,
  player_ids JSONB DEFAULT '[]'::jsonb,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create match_bookings table
CREATE TABLE IF NOT EXISTS match_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount_paid NUMERIC,
  status VARCHAR DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create coach_match_squads table
CREATE TABLE IF NOT EXISTS coach_match_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  player_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, coach_id)
);

-- 5. Create RPC function for incrementing booked slots safely
CREATE OR REPLACE FUNCTION increment_booked_slots(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE matches SET booked_slots = COALESCE(booked_slots, 0) + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
