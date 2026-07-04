-- Add app_logo_url to app_config table
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS app_logo_url text DEFAULT '';
