import { supabase } from '../supabase';
import type { SearchResult } from '../../types';

// Search locations using PostgreSQL Full-Text Search
export async function searchLocations(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_locations_with_highlights', {
    search_query: query,
    max_results: 50,
  });

  if (error) {
    console.error('Search error:', error);
    // Fallback to simple search if FTS fails
    return searchLocationsSimple(query);
  }

  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    preview_image_url: item.preview_image_url,
    rank: item.rank,
    matched_in: item.matched_in as 'location' | 'document' | 'both',
    name_highlight: item.name_highlight,
    description_highlight: item.description_highlight,
  }));
}

// Simple fallback search using ILIKE (direct query)
export async function searchLocationsSimple(query: string): Promise<SearchResult[]> {
  return searchLocationsDirect(query);
}

// Direct fallback search (last resort)
async function searchLocationsDirect(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, description, latitude, longitude, preview_image_url')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(50);

  if (error) {
    console.error('Direct search error:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    preview_image_url: item.preview_image_url,
    rank: 1,
    matched_in: 'location' as const,
  }));
}
