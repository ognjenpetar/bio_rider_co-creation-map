-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Create Storage Bucket Policies
-- ============================================

-- Note: Storage buckets and policies are typically created via
-- the Supabase Dashboard or API. This file documents the required
-- configuration for reference.

-- ============================================
-- BUCKET: location-images
-- ============================================
-- Public bucket for location images
-- Configuration:
--   Name: location-images
--   Public: true (for public URL access)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Policies (to be created in Supabase Dashboard):

-- SELECT: Allow authenticated users to read all images
-- INSERT: Allow users with editor+ role to upload
-- UPDATE: Allow users with editor+ role to update metadata
-- DELETE: Allow users with admin+ role to delete

-- ============================================
-- BUCKET: location-documents
-- ============================================
-- Private bucket for location documents
-- Configuration:
--   Name: location-documents
--   Public: false (requires authentication)
--   File size limit: 20MB
--   Allowed MIME types: application/pdf, application/msword,
--     application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Policies (to be created in Supabase Dashboard):

-- SELECT: Allow authenticated users to read documents
-- INSERT: Allow users with editor+ role to upload
-- UPDATE: Allow users with editor+ role to update metadata
-- DELETE: Allow users with admin+ role to delete

-- ============================================
-- SQL Equivalent Policies (for manual setup)
-- ============================================

-- Note: These require the storage schema and tables to exist.
-- Run only if setting up policies via SQL instead of Dashboard.

/*
-- Images bucket policies
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'location-images');

CREATE POLICY "Editors can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'location-images'
    AND public.can_edit()
);

CREATE POLICY "Editors can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'location-images'
    AND public.can_edit()
);

CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'location-images'
    AND public.is_admin()
);

-- Documents bucket policies
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'location-documents');

CREATE POLICY "Editors can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'location-documents'
    AND public.can_edit()
);

CREATE POLICY "Editors can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'location-documents'
    AND public.can_edit()
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'location-documents'
    AND public.is_admin()
);
*/
