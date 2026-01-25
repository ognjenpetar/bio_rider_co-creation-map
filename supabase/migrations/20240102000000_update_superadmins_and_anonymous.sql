-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Update Superadmins and Allow Anonymous Viewing
-- ============================================

-- ============================================
-- UPDATE: Auto-create profile with multiple superadmins
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
    superadmin_emails TEXT[] := ARRAY[
        'ognjenpetar@gmail.com',
        'jelenadavidovic25@gmail.com',
        'drazenglavic@gmail.com'
    ];
BEGIN
    -- Check if email is in superadmin list
    IF NEW.email = ANY(superadmin_emails) THEN
        user_role_val := 'superadmin';
    ELSE
        user_role_val := 'viewer';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        user_role_val
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE: RLS Policies for Anonymous Viewing
-- ============================================

-- Drop existing location policies if they exist
DROP POLICY IF EXISTS "Active locations are viewable by authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Locations viewable by everyone" ON public.locations;

-- Allow anyone (including anonymous) to view active locations
CREATE POLICY "Locations viewable by everyone"
    ON public.locations FOR SELECT
    USING (is_active = true);

-- Drop existing image policies if they exist
DROP POLICY IF EXISTS "Images are viewable by authenticated users" ON public.location_images;
DROP POLICY IF EXISTS "Images viewable by everyone" ON public.location_images;

-- Allow anyone to view images of active locations
CREATE POLICY "Images viewable by everyone"
    ON public.location_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.locations
            WHERE id = location_id AND is_active = true
        )
    );

-- Drop existing document policies if they exist
DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON public.location_documents;
DROP POLICY IF EXISTS "Documents viewable by everyone" ON public.location_documents;

-- Allow anyone to view documents of active locations
CREATE POLICY "Documents viewable by everyone"
    ON public.location_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.locations
            WHERE id = location_id AND is_active = true
        )
    );

-- ============================================
-- UPDATE: Helper function for anonymous access check
-- ============================================

-- Check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update can_edit to require authentication
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_authenticated() THEN
        RETURN FALSE;
    END IF;
    RETURN public.get_user_role() IN ('superadmin', 'admin', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update is_admin to require authentication
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_authenticated() THEN
        RETURN FALSE;
    END IF;
    RETURN public.get_user_role() IN ('superadmin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update is_superadmin to require authentication
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_authenticated() THEN
        RETURN FALSE;
    END IF;
    RETURN public.get_user_role() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- UPDATE: Existing superadmins in profiles table
-- Run this to update existing users if they already registered
-- ============================================

UPDATE public.profiles
SET role = 'superadmin'
WHERE email IN (
    'ognjenpetar@gmail.com',
    'jelenadavidovic25@gmail.com',
    'drazenglavic@gmail.com'
);
