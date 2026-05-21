import { supabase } from '../supabase';
import type { Zone, ZoneType } from '../../types';

export async function getZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(z => {
    const raw = z.vertices;
    const vertices: Array<{ lat: number; lng: number }> = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? JSON.parse(raw)
        : [];
    return { ...z, vertices };
  });
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
      vertices: data.vertices as unknown as string,
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

export async function updateZone(id: string, data: {
  name?: string;
  description?: string;
  zone_type?: ZoneType;
  color?: string;
  fill_color?: string;
}): Promise<Zone> {
  const { data: zone, error } = await supabase
    .from('zones')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  const raw = zone.vertices;
  const vertices = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : [];
  return { ...zone, vertices };
}

export async function deleteZone(id: string): Promise<void> {
  const { error } = await supabase
    .from('zones')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function resetAllZones(): Promise<void> {
  const { error } = await supabase
    .from('zones')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

  if (error) throw error;
}
