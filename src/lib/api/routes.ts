import { supabase } from '../supabase';
import type { Route } from '../../types';

export async function getRoutes(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(r => {
    const raw = r.waypoints;
    const waypoints: Array<{ lat: number; lng: number }> = Array.isArray(raw)
      ? raw as Array<{ lat: number; lng: number }>
      : typeof raw === 'string'
        ? JSON.parse(raw)
        : [];
    const anyR = r as any;
    const route_types: string[] = Array.isArray(anyR.route_types)
      ? anyR.route_types
      : [r.route_type || 'other'];
    return { ...r, waypoints, route_types } as unknown as Route;
  });
}

export async function createRoute(data: {
  name: string;
  description?: string;
  waypoints: Array<{ lat: number; lng: number }>;
  color?: string;
  created_by: string;
  route_type?: 'cycling' | 'walking' | 'hiking' | 'biotop' | 'other';
  route_types?: string[];
  distance_km?: number;
  estimated_time_min?: number;
}): Promise<Route> {
  const types = data.route_types && data.route_types.length > 0 ? data.route_types : [data.route_type || 'cycling'];
  const { data: route, error } = await supabase
    .from('routes')
    .insert({
      name: data.name,
      description: data.description || null,
      waypoints: data.waypoints as unknown as string,
      color: data.color || '#22c55e',
      created_by: data.created_by,
      route_type: types[0] as 'cycling' | 'walking' | 'hiking' | 'biotop' | 'other',
      distance_km: data.distance_km || null,
      estimated_time_min: data.estimated_time_min || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return {
    ...route,
    waypoints: data.waypoints,
    route_types: types,
  } as unknown as Route;
}

export async function updateRoute(id: string, data: {
  name?: string;
  description?: string;
  route_type?: 'cycling' | 'walking' | 'hiking' | 'biotop' | 'other';
  route_types?: string[];
  color?: string;
  distance_km?: number | null;
  estimated_time_min?: number | null;
}): Promise<Route> {
  const { data: route, error } = await supabase
    .from('routes')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  const anyR = route as any;
  const raw = anyR.waypoints;
  const waypoints = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : [];
  return { ...route, waypoints, route_types: anyR.route_types || [anyR.route_type || 'other'] } as unknown as Route;
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase
    .from('routes')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function resetAllRoutes(): Promise<void> {
  const { error } = await supabase
    .from('routes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
}
