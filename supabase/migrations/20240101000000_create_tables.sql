-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Create Tables
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'editor', 'viewer');

-- Edit suggestion status enum
CREATE TYPE suggestion_status AS ENUM ('pending', 'approved', 'rejected');

-- Document extraction status enum
CREATE TYPE extraction_status AS ENUM ('pending', 'completed', 'failed');

-- ============================================
-- TABLE: profiles (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX profiles_email_idx ON public.profiles (email);

-- ============================================
-- TABLE: locations
-- ============================================
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    preview_image_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Full-text search vector (generated column)
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED
);

-- Index for full-text search
CREATE INDEX locations_search_idx ON public.locations USING GIN (search_vector);

-- Index for geospatial queries
CREATE INDEX locations_coords_idx ON public.locations (latitude, longitude);

-- Index for active locations
CREATE INDEX locations_active_idx ON public.locations (is_active) WHERE is_active = true;

-- ============================================
-- TABLE: location_images
-- ============================================
CREATE TABLE public.location_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for location lookups
CREATE INDEX location_images_location_idx ON public.location_images (location_id);

-- Index for ordering
CREATE INDEX location_images_order_idx ON public.location_images (location_id, display_order);

-- ============================================
-- TABLE: location_documents
-- ============================================
CREATE TABLE public.location_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    extracted_text TEXT,
    extraction_status extraction_status DEFAULT 'pending',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Full-text search vector for document content
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(file_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(extracted_text, '')), 'C')
    ) STORED
);

-- Index for location lookups
CREATE INDEX location_documents_location_idx ON public.location_documents (location_id);

-- Index for full-text search
CREATE INDEX location_documents_search_idx ON public.location_documents USING GIN (search_vector);

-- ============================================
-- TABLE: edit_suggestions
-- ============================================
CREATE TABLE public.edit_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    suggested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('create', 'update', 'delete')),
    suggested_data JSONB NOT NULL,
    status suggestion_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Index for location lookups
CREATE INDEX edit_suggestions_location_idx ON public.edit_suggestions (location_id);

-- Index for status filtering
CREATE INDEX edit_suggestions_status_idx ON public.edit_suggestions (status);

-- Index for user suggestions
CREATE INDEX edit_suggestions_suggested_by_idx ON public.edit_suggestions (suggested_by);

-- Index for pending suggestions (commonly queried)
CREATE INDEX edit_suggestions_pending_idx ON public.edit_suggestions (status, created_at)
    WHERE status = 'pending';

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Hard-coded superadmin email
    IF NEW.email = 'ognjenpetar@gmail.com' THEN
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTIONS: Role Checking
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can edit (editor, admin, superadmin)
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('superadmin', 'admin', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin (admin, superadmin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('superadmin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
