-- Add session_token column to user_sessions (JWT-based session tracking)
-- First create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT,
  fcm_token    TEXT,
  platform     TEXT DEFAULT 'unknown',
  device_info  TEXT,
  ip_address   TEXT,
  is_active    BOOLEAN DEFAULT true,
  login_time   TIMESTAMPTZ DEFAULT NOW(),
  last_active  TIMESTAMPTZ DEFAULT NOW()
);

-- Add session_token column if table already exists
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS session_token TEXT;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
  ON user_sessions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token
  ON user_sessions(session_token);
