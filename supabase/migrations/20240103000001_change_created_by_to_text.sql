-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Change created_by from UUID to TEXT
-- ============================================
-- This migration changes the created_by field from UUID (profile reference)
-- to TEXT (username) since we switched to localStorage-based authentication

-- ============================================
-- ALTER LOCATIONS TABLE
-- ============================================

-- Drop the foreign key constraint
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS locations_created_by_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE public.locations
ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Add a comment explaining the field
COMMENT ON COLUMN public.locations.created_by IS 'Username of the person who created this location (localStorage auth)';
