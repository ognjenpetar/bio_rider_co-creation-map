import { supabase, STORAGE_BUCKETS, uploadFile, deleteFile, getStorageUrl } from '../supabase';
import type { Location, LocationWithFiles, LocationImage, LocationDocument } from '../../types';

// Fetch all active locations
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch single location by ID
export async function getLocation(id: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

// Fetch location with all related files
export async function getLocationWithFiles(id: string): Promise<LocationWithFiles | null> {
  const location = await getLocation(id);
  if (!location) return null;

  const [imagesResult, documentsResult] = await Promise.all([
    supabase
      .from('location_images')
      .select('*')
      .eq('location_id', id)
      .order('display_order', { ascending: true }),
    supabase
      .from('location_documents')
      .select('*')
      .eq('location_id', id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    ...location,
    images: imagesResult.data || [],
    documents: documentsResult.data || [],
  };
}

// Create new location
export async function createLocation(
  data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    created_by: string; // Username of the creator
  },
  images?: File[],
  documents?: File[]
): Promise<Location> {
  // Create location
  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      name: data.name,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      created_by: data.created_by,
    })
    .select()
    .single();

  if (error) throw error;

  // Upload images if provided
  if (images?.length) {
    const firstImage = await uploadLocationImages(location.id, images);
    if (firstImage) {
      // Update location with preview image
      await supabase
        .from('locations')
        .update({ preview_image_url: getStorageUrl(STORAGE_BUCKETS.IMAGES, firstImage) })
        .eq('id', location.id);
    }
  }

  // Upload documents if provided
  if (documents?.length) {
    await uploadLocationDocuments(location.id, documents);
  }

  return location;
}

// Update location
export async function updateLocation(
  id: string,
  data: {
    name?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    preview_image_url?: string;
  }
): Promise<Location> {
  const { data: location, error } = await supabase
    .from('locations')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return location;
}

// Delete location (soft delete - set is_active to false)
export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Hard delete location (admin only)
export async function hardDeleteLocation(id: string): Promise<void> {
  // Delete all associated files from storage first
  const [images, documents] = await Promise.all([
    supabase.from('location_images').select('storage_path').eq('location_id', id),
    supabase.from('location_documents').select('storage_path').eq('location_id', id),
  ]);

  // Delete files from storage
  const deletePromises: Promise<void>[] = [];
  images.data?.forEach((img) => {
    deletePromises.push(deleteFile(STORAGE_BUCKETS.IMAGES, img.storage_path));
  });
  documents.data?.forEach((doc) => {
    deletePromises.push(deleteFile(STORAGE_BUCKETS.DOCUMENTS, doc.storage_path));
  });

  await Promise.allSettled(deletePromises);

  // Delete location (cascades to related tables)
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Upload images for a location
export async function uploadLocationImages(
  locationId: string,
  files: File[]
): Promise<string | null> {
  let firstPath: string | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const filePath = `${locationId}/${crypto.randomUUID()}.${fileExt}`;

    try {
      const path = await uploadFile(STORAGE_BUCKETS.IMAGES, filePath, file);

      if (i === 0) {
        firstPath = path;
      }

      // Create database record
      await supabase.from('location_images').insert({
        location_id: locationId,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: i,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  return firstPath;
}

// Upload documents for a location
export async function uploadLocationDocuments(
  locationId: string,
  files: File[]
): Promise<void> {
  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${locationId}/${crypto.randomUUID()}.${fileExt}`;

    try {
      const path = await uploadFile(STORAGE_BUCKETS.DOCUMENTS, filePath, file);

      // Create database record
      await supabase.from('location_documents').insert({
        location_id: locationId,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        extraction_status: 'pending',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  }
}

// Get images for a location
export async function getLocationImages(locationId: string): Promise<LocationImage[]> {
  const { data, error } = await supabase
    .from('location_images')
    .select('*')
    .eq('location_id', locationId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get documents for a location
export async function getLocationDocuments(locationId: string): Promise<LocationDocument[]> {
  const { data, error } = await supabase
    .from('location_documents')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Delete an image
export async function deleteLocationImage(id: string, storagePath: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.IMAGES, storagePath);

  const { error } = await supabase
    .from('location_images')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Delete a document
export async function deleteLocationDocument(id: string, storagePath: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.DOCUMENTS, storagePath);

  const { error } = await supabase
    .from('location_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Reset map - delete all locations (admin only)
export async function resetAllLocations(): Promise<void> {
  // Get all locations
  const { data: locations, error: fetchError } = await supabase
    .from('locations')
    .select('id');

  if (fetchError) throw fetchError;

  // Delete each location with its files
  for (const location of locations || []) {
    await hardDeleteLocation(location.id);
  }
}
