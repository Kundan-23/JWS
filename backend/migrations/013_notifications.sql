-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries per user
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, user_type);

-- Enable realtime for notifications
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Note: In Supabase Dashboard, you may also need to go to Database -> Replication 
-- and enable replication for the "notifications" table explicitly to use WebSockets.
