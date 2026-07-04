-- ═══════════════════════════════════════════════════════════
-- GICL Sports Platform — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLE: coaches (created first, players references it) ────
CREATE TABLE IF NOT EXISTS coaches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gicl_id           TEXT UNIQUE,
  registration_number INTEGER UNIQUE,

  -- Auth
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT,
  role              TEXT NOT NULL DEFAULT 'coach',

  -- Personal Info
  first_name        TEXT,
  last_name         TEXT,
  dob               DATE,
  whatsapp          TEXT,
  location          TEXT,
  zip_code          TEXT,

  -- Documents
  birth_cert_url    TEXT,
  address_proof_url TEXT,
  docs_approved     BOOLEAN DEFAULT FALSE,

  -- Coach Profile
  experience        TEXT,
  cricket_history   TEXT,
  coaching_history  TEXT,
  referral_code     TEXT UNIQUE,
  referred_by       TEXT,
  referral_points   NUMERIC DEFAULT 0,
  status            TEXT DEFAULT 'Active',
  max_squad_size    INTEGER DEFAULT 20,
  my_uploads        JSONB DEFAULT '[]'::jsonb,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: players ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gicl_id               TEXT UNIQUE,
  registration_number   INTEGER UNIQUE,

  -- Auth (Login ID = Email)
  email                 TEXT UNIQUE NOT NULL,
  password_hash         TEXT,
  role                  TEXT NOT NULL DEFAULT 'player',

  -- Basic Info
  first_name            TEXT,
  last_name             TEXT,
  dob                   DATE,
  gender                TEXT,
  whatsapp              TEXT,
  emergency_contact     TEXT,
  blood_group           TEXT,
  parent_name           TEXT,

  -- Address
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  country               TEXT DEFAULT 'India',
  zip_code              TEXT,

  -- Profile
  profile_photo_url     TEXT,
  jersey_size           TEXT,
  instagram_link        TEXT,

  -- Documents
  address_proof_url     TEXT,
  birth_cert_url        TEXT,
  docs_approved         BOOLEAN DEFAULT FALSE,

  -- Cricket Profile
  height                NUMERIC,
  weight                NUMERIC,
  batting_style         TEXT,
  bowling_style         TEXT,
  field_positions       TEXT[] DEFAULT '{}',
  balls_selected        TEXT[] DEFAULT '{}',
  cricket_history       JSONB DEFAULT '[]'::jsonb,
  club_associated       TEXT DEFAULT 'no',
  clubs_details         JSONB DEFAULT '[]'::jsonb,

  -- Media
  gameplay_links        JSONB DEFAULT '{"batting":[],"bowling":[],"fielding":[],"wk":[]}'::jsonb,
  gallery_urls          TEXT[] DEFAULT '{}',

  -- Membership & Payment
  plan                  TEXT,
  payment_status        TEXT DEFAULT 'pending',
  payment_order_id      TEXT,
  payment_id            TEXT,

  -- Referral
  referral_code         TEXT UNIQUE,
  referred_by_id        UUID REFERENCES players(id) ON DELETE SET NULL,
  referral_balance      NUMERIC DEFAULT 0,

  -- Dashboard
  is_dashboard_unlocked BOOLEAN DEFAULT FALSE,
  allocated_coach_id    UUID REFERENCES coaches(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: admins ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'admin',
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: matches ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  date        TIMESTAMPTZ,
  location    TEXT,
  type        TEXT,
  team_a      TEXT,
  team_b      TEXT,
  age_group   TEXT,
  status      TEXT DEFAULT 'upcoming',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_players (
  match_id  UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS match_coaches (
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, coach_id)
);

-- ─── TABLE: app_config (singleton) ────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  id                       INTEGER PRIMARY KEY DEFAULT 1,
  age_groups               JSONB DEFAULT '[]'::jsonb,
  jersey_sizes             TEXT[] DEFAULT '{"S","M","L","XL","XXL"}'::text[],
  batting_styles           TEXT[] DEFAULT '{"Right-hand Bat","Left-hand Bat","None"}'::text[],
  bowling_styles           TEXT[] DEFAULT '{"Right-arm Fast","Right-arm Off Spin","Left-arm Orthodox","Right-arm Leg Spin","None"}'::text[],
  clubs                    JSONB DEFAULT '[]'::jsonb,
  ball_types               JSONB DEFAULT '[]'::jsonb,
  plans                    JSONB DEFAULT '[]'::jsonb,
  banners                  JSONB DEFAULT '[]'::jsonb,
  ad_banners               JSONB DEFAULT '[]'::jsonb,
  referral_points_per_user NUMERIC DEFAULT 0.5,
  max_squad_size           INTEGER DEFAULT 20,
  match_team_size          INTEGER DEFAULT 11,
  next_registration_number INTEGER DEFAULT 1,
  landing_bg_image         TEXT,
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- Seed the single config row
INSERT INTO app_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ─── TABLE: referrals ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID REFERENCES players(id) ON DELETE SET NULL,
  referred_id   UUID REFERENCES players(id) ON DELETE SET NULL,
  amount_earned NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: otp_codes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  purpose     TEXT NOT NULL CHECK (purpose IN ('register', 'reset_password')),
  attempts    INTEGER DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_codes(email, purpose);

-- ─── TABLE: player_videos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS player_videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID REFERENCES players(id) ON DELETE CASCADE,
  title          TEXT,
  video_url      TEXT,
  thumbnail_url  TEXT,
  status         TEXT DEFAULT 'Pending',
  review_comment TEXT,
  review_flag    TEXT CHECK (review_flag IN ('green', 'yellow', 'red', NULL)),
  reviewed_by    UUID REFERENCES coaches(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- SQL FUNCTION: Atomic registration number increment
-- Called by giclId.js to prevent duplicate GICL IDs
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_registration_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_number INTEGER;
BEGIN
  UPDATE app_config
  SET next_registration_number = next_registration_number + 1
  WHERE id = 1
  RETURNING next_registration_number - 1 INTO current_number;
  RETURN current_number;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables, then add policies
-- ═══════════════════════════════════════════════════════════
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_videos ENABLE ROW LEVEL SECURITY;

-- Service role (backend) bypasses ALL RLS
-- All our API calls use the service_role key, so all access is permitted.
-- Public/anon role has NO access by default.

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- Create these manually in Supabase Dashboard > Storage
-- or via Supabase CLI:
-- supabase storage create profile-photos --public=false
-- supabase storage create documents --public=false  
-- supabase storage create banners --public=true
-- supabase storage create ad-banners --public=true
-- ═══════════════════════════════════════════════════════════
