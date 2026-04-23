-- Add vote counters to routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS votes_up INTEGER NOT NULL DEFAULT 0;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS votes_down INTEGER NOT NULL DEFAULT 0;

-- Route votes table (one vote per user per route)
CREATE TABLE IF NOT EXISTS route_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_vote_unique ON route_votes(route_id, username);
CREATE INDEX IF NOT EXISTS idx_route_votes_route ON route_votes(route_id);
ALTER TABLE route_votes DISABLE ROW LEVEL SECURITY;

-- Route comments table
CREATE TABLE IF NOT EXISTS route_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  comment TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_route_comments_route ON route_comments(route_id);
CREATE INDEX IF NOT EXISTS idx_route_comments_created ON route_comments(created_at DESC);
ALTER TABLE route_comments DISABLE ROW LEVEL SECURITY;

-- Add vote counters to zones
ALTER TABLE zones ADD COLUMN IF NOT EXISTS votes_up INTEGER NOT NULL DEFAULT 0;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS votes_down INTEGER NOT NULL DEFAULT 0;

-- Zone votes table (one vote per user per zone)
CREATE TABLE IF NOT EXISTS zone_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_zone_vote_unique ON zone_votes(zone_id, username);
CREATE INDEX IF NOT EXISTS idx_zone_votes_zone ON zone_votes(zone_id);
ALTER TABLE zone_votes DISABLE ROW LEVEL SECURITY;

-- Zone comments table
CREATE TABLE IF NOT EXISTS zone_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  comment TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zone_comments_zone ON zone_comments(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_comments_created ON zone_comments(created_at DESC);
ALTER TABLE zone_comments DISABLE ROW LEVEL SECURITY;
