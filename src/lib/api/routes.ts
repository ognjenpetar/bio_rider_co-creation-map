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
      ? raw
      : typeof raw === 'string'
        ? JSON.parse(raw)
        : [];
    return { ...r, waypoints };
  });
}

export async function createRoute(data: {
  name: string;
  description?: string;
  waypoints: Array<{ lat: number; lng: number }>;
  color?: string;
  created_by: string;
  route_type?: 'cycling' | 'walking' | 'hiking' | 'other';
  distance_km?: number;
  estimated_time_min?: number;
}): Promise<Route> {
  const { data: route, error } = await supabase
    .from('routes')
    .insert({
      name: data.name,
      description: data.description || null,
      waypoints: data.waypoints as unknown as string,
      color: data.color || '#22c55e',
      created_by: data.created_by,
      route_type: data.route_type || 'cycling',
      distance_km: data.distance_km || null,
      estimated_time_min: data.estimated_time_min || null,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...route,
    waypoints: data.waypoints,
  };
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase
    .from('routes')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}
