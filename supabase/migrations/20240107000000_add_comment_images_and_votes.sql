-- Add image support to comments
ALTER TABLE location_comments ADD COLUMN IF NOT EXISTS image_storage_path TEXT;
ALTER TABLE location_comments ADD COLUMN IF NOT EXISTS image_file_name TEXT;

-- Add voting columns to locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS votes_up INTEGER NOT NULL DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS votes_down INTEGER NOT NULL DEFAULT 0;

-- Location votes table
CREATE TABLE IF NOT EXISTS location_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_vote_unique
  ON location_votes(location_id, username);

CREATE INDEX IF NOT EXISTS idx_location_votes_location
  ON location_votes(location_id);

ALTER TABLE location_votes DISABLE ROW LEVEL SECURITY;
