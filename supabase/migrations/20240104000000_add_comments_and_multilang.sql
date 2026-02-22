-- ============================================
-- Bio Rider Co-Creation Map
-- Migration: Add Comments, Ratings & Multilingual Descriptions
-- ============================================

-- ============================================
-- MULTILINGUAL DESCRIPTIONS
-- ============================================
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS description_sr TEXT;

-- ============================================
-- COMMENTS & RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.location_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    comment TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS location_comments_location_idx ON public.location_comments (location_id);
CREATE INDEX IF NOT EXISTS location_comments_created_idx ON public.location_comments (created_at DESC);

-- Disable RLS (consistent with other tables)
ALTER TABLE public.location_comments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- Click RUN to execute
