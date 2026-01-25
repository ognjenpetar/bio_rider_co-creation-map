-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Create RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_suggestions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Everyone can read profiles (needed for displaying names/avatars)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile basics"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

-- Superadmin can update any profile including roles
CREATE POLICY "Superadmin can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_superadmin());

-- ============================================
-- LOCATIONS POLICIES
-- ============================================

-- All authenticated users can view active locations
CREATE POLICY "Active locations are viewable by authenticated users"
    ON public.locations FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

-- Only editors/admins/superadmin can insert locations
CREATE POLICY "Editors can create locations"
    ON public.locations FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit());

-- Only editors/admins/superadmin can update locations
CREATE POLICY "Editors can update locations"
    ON public.locations FOR UPDATE
    TO authenticated
    USING (public.can_edit())
    WITH CHECK (public.can_edit());

-- Only admins/superadmin can delete locations
CREATE POLICY "Admins can delete locations"
    ON public.locations FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- LOCATION_IMAGES POLICIES
-- ============================================

-- All authenticated users can view images for visible locations
CREATE POLICY "Images are viewable by authenticated users"
    ON public.location_images FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.locations
            WHERE id = location_id
            AND (is_active = true OR public.is_admin())
        )
    );

-- Only editors can insert images
CREATE POLICY "Editors can upload images"
    ON public.location_images FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit());

-- Only editors can update image metadata
CREATE POLICY "Editors can update images"
    ON public.location_images FOR UPDATE
    TO authenticated
    USING (public.can_edit())
    WITH CHECK (public.can_edit());

-- Only admins can delete images
CREATE POLICY "Admins can delete images"
    ON public.location_images FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- LOCATION_DOCUMENTS POLICIES
-- ============================================

-- All authenticated users can view documents for visible locations
CREATE POLICY "Documents are viewable by authenticated users"
    ON public.location_documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.locations
            WHERE id = location_id
            AND (is_active = true OR public.is_admin())
        )
    );

-- Only editors can insert documents
CREATE POLICY "Editors can upload documents"
    ON public.location_documents FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit());

-- Only editors can update document metadata
CREATE POLICY "Editors can update documents"
    ON public.location_documents FOR UPDATE
    TO authenticated
    USING (public.can_edit())
    WITH CHECK (public.can_edit());

-- Only admins can delete documents
CREATE POLICY "Admins can delete documents"
    ON public.location_documents FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- EDIT_SUGGESTIONS POLICIES
-- ============================================

-- Users can view their own suggestions, admins can view all
CREATE POLICY "Users can view own suggestions, admins can view all"
    ON public.edit_suggestions FOR SELECT
    TO authenticated
    USING (
        suggested_by = auth.uid()
        OR public.is_admin()
    );

-- Any authenticated user can create suggestions
CREATE POLICY "Authenticated users can create suggestions"
    ON public.edit_suggestions FOR INSERT
    TO authenticated
    WITH CHECK (suggested_by = auth.uid());

-- Only admins can update suggestions (for approval/rejection)
CREATE POLICY "Admins can update suggestions"
    ON public.edit_suggestions FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Only superadmin can delete suggestions
CREATE POLICY "Superadmin can delete suggestions"
    ON public.edit_suggestions FOR DELETE
    TO authenticated
    USING (public.is_superadmin());
