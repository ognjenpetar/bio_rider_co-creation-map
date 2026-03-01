import { supabase, STORAGE_BUCKETS, uploadFile, deleteFile, getStorageUrl } from '../supabase';
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

// Add a new comment/rating for a location, optionally with an image
export async function addComment(data: {
  location_id: string;
  username: string;
  comment?: string;
  rating: number;
  image?: File;
}): Promise<LocationComment> {
  let image_storage_path: string | null = null;
  let image_file_name: string | null = null;

  // Upload image first if provided
  if (data.image) {
    const ext = data.image.name.split('.').pop() || 'jpg';
    const filePath = `comments/${data.location_id}/${crypto.randomUUID()}.${ext}`;
    image_storage_path = await uploadFile(STORAGE_BUCKETS.IMAGES, filePath, data.image);
    image_file_name = data.image.name;
  }

  const { data: comment, error } = await supabase
    .from('location_comments')
    .insert({
      location_id: data.location_id,
      username: data.username,
      comment: data.comment || null,
      rating: data.rating,
      image_storage_path,
      image_file_name,
    })
    .select()
    .single();

  if (error) throw error;
  return comment;
}

// Delete a comment by ID (also cleans up image from storage)
export async function deleteComment(id: string): Promise<void> {
  // Fetch comment first to check for image
  const { data: comment } = await supabase
    .from('location_comments')
    .select('image_storage_path')
    .eq('id', id)
    .single();

  if (comment?.image_storage_path) {
    try {
      await deleteFile(STORAGE_BUCKETS.IMAGES, comment.image_storage_path);
    } catch {
      // continue even if storage delete fails
    }
  }

  const { error } = await supabase
    .from('location_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Helper to get public URL for a comment image
export function getCommentImageUrl(storagePath: string): string {
  return getStorageUrl(STORAGE_BUCKETS.IMAGES, storagePath);
}
