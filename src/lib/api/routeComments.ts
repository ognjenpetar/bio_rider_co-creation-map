import { supabase } from '../supabase';
import type { RouteComment } from '../../types';

export async function getRouteComments(routeId: string): Promise<RouteComment[]> {
  const { data, error } = await supabase
    .from('route_comments')
    .select('*')
    .eq('route_id', routeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addRouteComment(data: {
  route_id: string;
  username: string;
  comment?: string;
  rating: number;
}): Promise<RouteComment> {
  const { data: comment, error } = await supabase
    .from('route_comments')
    .insert({
      route_id: data.route_id,
      username: data.username,
      comment: data.comment || null,
      rating: data.rating,
    })
    .select()
    .single();

  if (error) throw error;
  return comment;
}

export async function deleteRouteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('route_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
