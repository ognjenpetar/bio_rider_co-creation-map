import { supabase } from '../supabase';
import type { ZoneComment } from '../../types';

export async function getZoneComments(zoneId: string): Promise<ZoneComment[]> {
  const { data, error } = await supabase
    .from('zone_comments')
    .select('*')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addZoneComment(data: {
  zone_id: string;
  username: string;
  comment?: string;
  rating: number;
}): Promise<ZoneComment> {
  const { data: comment, error } = await supabase
    .from('zone_comments')
    .insert({
      zone_id: data.zone_id,
      username: data.username,
      comment: data.comment || null,
      rating: data.rating,
    })
    .select()
    .single();

  if (error) throw error;
  return comment;
}

export async function deleteZoneComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('zone_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
