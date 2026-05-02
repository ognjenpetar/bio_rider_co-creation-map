import { supabase } from '../supabase';

export interface BasicStats {
  locationCount: number;
  userCount: number;
}

export async function getBasicStats(): Promise<BasicStats> {
  const [locs, routes, zones, locComments, routeComments, zoneComments] = await Promise.all([
    supabase.from('locations').select('created_by').eq('is_active', true),
    supabase.from('routes').select('created_by').eq('is_active', true),
    supabase.from('zones').select('created_by').eq('is_active', true),
    supabase.from('location_comments').select('username'),
    supabase.from('route_comments').select('username'),
    supabase.from('zone_comments').select('username'),
  ]);

  const locationCount = (locs.data?.length || 0) + (routes.data?.length || 0) + (zones.data?.length || 0);

  const usernames = new Set<string>();
  (locs.data || []).forEach(r => r.created_by && usernames.add(r.created_by.toLowerCase()));
  (routes.data || []).forEach(r => r.created_by && usernames.add(r.created_by.toLowerCase()));
  (zones.data || []).forEach(r => r.created_by && usernames.add(r.created_by.toLowerCase()));
  (locComments.data || []).forEach(r => r.username && usernames.add(r.username.toLowerCase()));
  (routeComments.data || []).forEach(r => r.username && usernames.add(r.username.toLowerCase()));
  (zoneComments.data || []).forEach(r => r.username && usernames.add(r.username.toLowerCase()));

  return { locationCount, userCount: usernames.size };
}
