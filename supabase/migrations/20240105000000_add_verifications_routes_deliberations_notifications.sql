-- =============================================
-- Migration: Add verifications, routes, deliberations, notifications
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Location Verifications
CREATE TABLE IF NOT EXISTS location_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT true,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one verification per user per location
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_unique
  ON location_verifications(location_id, username);

ALTER TABLE location_verifications DISABLE ROW LEVEL SECURITY;

-- 2. Routes (polylines between locations)
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  waypoints JSONB NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT '#22c55e',
  created_by TEXT NOT NULL,
  distance_km NUMERIC(10,2),
  estimated_time_min INTEGER,
  route_type TEXT NOT NULL DEFAULT 'cycling'
    CHECK (route_type IN ('cycling', 'walking', 'hiking', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE routes DISABLE ROW LEVEL SECURITY;

-- 3. Deliberations (structured discussions per location)
CREATE TABLE IF NOT EXISTS deliberations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'identification'
    CHECK (phase IN ('identification', 'proposals', 'argumentation', 'consensus', 'closed')),
  created_by TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deliberations DISABLE ROW LEVEL SECURITY;

-- 4. Deliberation entries (posts within a deliberation)
CREATE TABLE IF NOT EXISTS deliberation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliberation_id UUID NOT NULL REFERENCES deliberations(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'comment'
    CHECK (entry_type IN ('problem', 'proposal', 'argument_for', 'argument_against', 'consensus', 'comment')),
  content TEXT NOT NULL,
  votes_up INTEGER NOT NULL DEFAULT 0,
  votes_down INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deliberation_entries DISABLE ROW LEVEL SECURITY;

-- 5. Deliberation votes
CREATE TABLE IF NOT EXISTS deliberation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES deliberation_entries(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deliberation_vote_unique
  ON deliberation_votes(entry_id, username);

ALTER TABLE deliberation_votes DISABLE ROW LEVEL SECURITY;

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'new_location'
    CHECK (type IN ('new_location', 'new_comment', 'verification', 'deliberation', 'route')),
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(username, is_read);

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Done! All tables created with RLS disabled for localStorage auth.
