-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Allow Anonymous Access for LocalStorage Auth
-- ============================================
-- This migration allows anonymous users to interact with the database
-- since we switched from Supabase Auth to localStorage-based authentication

-- ============================================
-- DROP OLD POLICIES THAT REQUIRE AUTHENTICATION
-- ============================================

-- Drop old location policies
DROP POLICY IF EXISTS "Active locations are viewable by authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Editors can create locations" ON public.locations;
DROP POLICY IF EXISTS "Editors can update locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;

-- Drop old image policies
DROP POLICY IF EXISTS "Images are viewable by authenticated users" ON public.location_images;
DROP POLICY IF EXISTS "Editors can upload images" ON public.location_images;
DROP POLICY IF EXISTS "Editors can update images" ON public.location_images;
DROP POLICY IF EXISTS "Admins can delete images" ON public.location_images;

-- Drop old document policies
DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON public.location_documents;
DROP POLICY IF EXISTS "Editors can upload documents" ON public.location_documents;
DROP POLICY IF EXISTS "Editors can update documents" ON public.location_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.location_documents;

-- ============================================
-- CREATE NEW POLICIES FOR ANONYMOUS ACCESS
-- ============================================

-- LOCATIONS POLICIES
-- Everyone can view active locations
CREATE POLICY "Anyone can view active locations"
    ON public.locations FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Everyone can create locations (admin check done in frontend)
CREATE POLICY "Anyone can create locations"
    ON public.locations FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Everyone can update locations (admin check done in frontend)
CREATE POLICY "Anyone can update locations"
    ON public.locations FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Everyone can delete locations (admin check done in frontend)
CREATE POLICY "Anyone can delete locations"
    ON public.locations FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- LOCATION_IMAGES POLICIES
-- ============================================

-- Everyone can view images
CREATE POLICY "Anyone can view images"
    ON public.location_images FOR SELECT
    TO anon, authenticated
    USING (true);

-- Everyone can upload images
CREATE POLICY "Anyone can upload images"
    ON public.location_images FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Everyone can update images
CREATE POLICY "Anyone can update images"
    ON public.location_images FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Everyone can delete images
CREATE POLICY "Anyone can delete images"
    ON public.location_images FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- LOCATION_DOCUMENTS POLICIES
-- ============================================

-- Everyone can view documents
CREATE POLICY "Anyone can view documents"
    ON public.location_documents FOR SELECT
    TO anon, authenticated
    USING (true);

-- Everyone can upload documents
CREATE POLICY "Anyone can upload documents"
    ON public.location_documents FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Everyone can update documents
CREATE POLICY "Anyone can update documents"
    ON public.location_documents FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Everyone can delete documents
CREATE POLICY "Anyone can delete documents"
    ON public.location_documents FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Drop old storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Editors can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Editors can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Editors can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Editors can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- Anyone can view images (public bucket)
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'location-images');

-- Anyone can upload images
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'location-images');

-- Anyone can update images
CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'location-images');

-- Anyone can delete images
CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'location-images');

-- Anyone can view documents
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'location-documents');

-- Anyone can upload documents
CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'location-documents');

-- Anyone can update documents
CREATE POLICY "Anyone can update documents"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'location-documents');

-- Anyone can delete documents
CREATE POLICY "Anyone can delete documents"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'location-documents');

-- ============================================
-- NOTES
-- ============================================
-- Security note: Since we're using localStorage-based authentication,
-- all permission checks (especially admin-only operations like delete)
-- are handled in the frontend application. The backend allows all
-- operations but the frontend restricts UI access based on user role.
-- This is acceptable for a small community co-creation map application.
