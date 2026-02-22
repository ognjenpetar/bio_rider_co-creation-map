import { supabase } from '../supabase';
import type { LocationComment } from '../../types';

// Fetch all comments for a location
export async function getComments(locationId: string): Promise<LocationComment[]> {
  const { data, error } = await supabase
    .from('location_comments')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get average rating and total count for a location
export async function getAverageRating(
  locationId: string
): Promise<{ average: number; count: number }> {
  const { data, error } = await supabase
    .from('location_comments')
    .select('rating')
    .eq('location_id', locationId);

  if (error) throw error;

  const ratings = data || [];
  if (ratings.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = ratings.reduce((acc, row) => acc + row.rating, 0);
  return {
    average: sum / ratings.length,
    count: ratings.length,
  };
}

// Add a new comment/rating for a location
export async function addComment(data: {
  location_id: string;
  username: string;
  comment?: string;
  rating: number;
}): Promise<LocationComment> {
  const { data: comment, error } = await supabase
    .from('location_comments')
    .insert({
      location_id: data.location_id,
      username: data.username,
      comment: data.comment || null,
      rating: data.rating,
    })
    .select()
    .single();

  if (error) throw error;
  return comment;
}

// Delete a comment by ID
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('location_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
