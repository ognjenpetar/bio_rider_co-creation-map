import { supabase } from '../supabase';
import type { Zone, ZoneType } from '../../types';

export async function getZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(z => ({
    ...z,
    vertices: (z.vertices as Array<{ lat: number; lng: number }>) || [],
  }));
}

export async function createZone(data: {
  name: string;
  description?: string;
  vertices: Array<{ lat: number; lng: number }>;
  color?: string;
  fill_color?: string;
  created_by: string;
  zone_type?: ZoneType;
}): Promise<Zone> {
  const { data: zone, error } = await supabase
    .from('zones')
    .insert({
      name: data.name,
      description: data.description || null,
      vertices: JSON.stringify(data.vertices),
      color: data.color || '#6366f1',
      fill_color: data.fill_color || '#a5b4fc',
      created_by: data.created_by,
      zone_type: data.zone_type || 'other',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...zone,
    vertices: data.vertices,
  };
}

export async function deleteZone(id: string): Promise<void> {
  const { error } = await supabase
    .from('zones')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}
