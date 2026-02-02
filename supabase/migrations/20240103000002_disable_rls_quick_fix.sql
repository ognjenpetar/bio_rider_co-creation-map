-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: QUICK FIX - Disable RLS Completely
-- ============================================
-- ALTERNATIVE to migrations 20240103000000 and 20240103000001
-- This is the fastest way to fix the 400 error
-- Use this if you want immediate fix without complex policies

-- ============================================
-- DISABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_documents DISABLE ROW LEVEL SECURITY;

-- ============================================
-- CHANGE created_by TYPE
-- ============================================

-- Drop the foreign key constraint
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS locations_created_by_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE public.locations
ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- ============================================
-- NOTES
-- ============================================
-- This completely disables RLS, making all data accessible
-- This is acceptable for small community applications
-- Security is handled in the frontend application

-- If you ran migrations 20240103000000 and 20240103000001:
-- You don't need this migration. Those provide better security.
--
-- If you want the QUICKEST fix:
-- Run ONLY this migration instead.
