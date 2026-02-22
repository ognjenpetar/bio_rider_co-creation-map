-- =============================================
-- Migration: Add zones (polygon areas)
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  vertices JSONB NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT '#6366f1',
  fill_color TEXT NOT NULL DEFAULT '#a5b4fc',
  created_by TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'other'
    CHECK (zone_type IN ('park', 'cycling', 'restricted', 'residential', 'commercial', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active);

ALTER TABLE zones DISABLE ROW LEVEL SECURITY;

-- Done!
