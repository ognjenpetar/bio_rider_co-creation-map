CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('permanent', 'temporary')),
  ban_until TIMESTAMPTZ,
  reason TEXT,
  banned_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_bans_username_idx ON user_bans(username);
