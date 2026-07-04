-- Migration 011: Coach Video Uploads Table

CREATE TABLE IF NOT EXISTS coach_video_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reject_reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Note: When approved, the admin also pushes the video to `app_config.advance_training_videos`
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS advance_training_videos jsonb DEFAULT '[]'::jsonb;
