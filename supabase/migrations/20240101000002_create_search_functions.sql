-- ============================================
-- Bio Rider Co-Creation Map Database Schema
-- Migration: Create Search Functions
-- ============================================

-- ============================================
-- FUNCTION: Combined search across locations and documents
-- ============================================
CREATE OR REPLACE FUNCTION public.search_locations(search_query TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    preview_image_url TEXT,
    rank REAL,
    matched_in TEXT
) AS $$
BEGIN
    -- Return empty if query is empty or null
    IF search_query IS NULL OR TRIM(search_query) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH location_matches AS (
        SELECT
            l.id,
            l.name,
            l.description,
            l.latitude,
            l.longitude,
            l.preview_image_url,
            ts_rank(l.search_vector, websearch_to_tsquery('english', search_query)) AS loc_rank
        FROM public.locations l
        WHERE
            l.is_active = true
            AND l.search_vector @@ websearch_to_tsquery('english', search_query)
    ),
    document_matches AS (
        SELECT DISTINCT
            l.id,
            l.name,
            l.description,
            l.latitude,
            l.longitude,
            l.preview_image_url,
            MAX(ts_rank(d.search_vector, websearch_to_tsquery('english', search_query))) AS doc_rank
        FROM public.locations l
        JOIN public.location_documents d ON d.location_id = l.id
        WHERE
            l.is_active = true
            AND d.search_vector @@ websearch_to_tsquery('english', search_query)
        GROUP BY l.id, l.name, l.description, l.latitude, l.longitude, l.preview_image_url
    )
    SELECT
        COALESCE(lm.id, dm.id) AS id,
        COALESCE(lm.name, dm.name) AS name,
        COALESCE(lm.description, dm.description) AS description,
        COALESCE(lm.latitude, dm.latitude) AS latitude,
        COALESCE(lm.longitude, dm.longitude) AS longitude,
        COALESCE(lm.preview_image_url, dm.preview_image_url) AS preview_image_url,
        COALESCE(lm.loc_rank, 0::real) + COALESCE(dm.doc_rank, 0::real) AS rank,
        CASE
            WHEN lm.id IS NOT NULL AND dm.id IS NOT NULL THEN 'both'
            WHEN lm.id IS NOT NULL THEN 'location'
            ELSE 'document'
        END AS matched_in
    FROM location_matches lm
    FULL OUTER JOIN document_matches dm ON lm.id = dm.id
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FUNCTION: Search with highlights
-- ============================================
CREATE OR REPLACE FUNCTION public.search_locations_with_highlights(
    search_query TEXT,
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    preview_image_url TEXT,
    rank REAL,
    matched_in TEXT,
    name_highlight TEXT,
    description_highlight TEXT
) AS $$
BEGIN
    -- Return empty if query is empty or null
    IF search_query IS NULL OR TRIM(search_query) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        s.id,
        s.name,
        s.description,
        s.latitude,
        s.longitude,
        s.preview_image_url,
        s.rank,
        s.matched_in,
        ts_headline('english', s.name, websearch_to_tsquery('english', search_query),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25') AS name_highlight,
        ts_headline('english', COALESCE(s.description, ''), websearch_to_tsquery('english', search_query),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=100, MinWords=50') AS description_highlight
    FROM public.search_locations(search_query) s
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FUNCTION: Simple text search (fallback for simple queries)
-- ============================================
CREATE OR REPLACE FUNCTION public.search_locations_simple(search_query TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    preview_image_url TEXT
) AS $$
BEGIN
    -- Return empty if query is empty or null
    IF search_query IS NULL OR TRIM(search_query) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.description,
        l.latitude,
        l.longitude,
        l.preview_image_url
    FROM public.locations l
    WHERE
        l.is_active = true
        AND (
            l.name ILIKE '%' || search_query || '%'
            OR l.description ILIKE '%' || search_query || '%'
        )
    ORDER BY
        CASE WHEN l.name ILIKE search_query || '%' THEN 0 ELSE 1 END,
        l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
