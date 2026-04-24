import { supabase } from '../supabase';
import { uploadFile, deleteFile, getStorageUrl, STORAGE_BUCKETS } from '../supabase';

export interface RouteImage {
  id: string;
  route_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
}

export interface RouteDocument {
  id: string;
  route_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_by: string | null;
  created_at: string;
}

export async function getRouteImages(routeId: string): Promise<RouteImage[]> {
  const { data, error } = await supabase
    .from('route_images')
    .select('*')
    .eq('route_id', routeId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getRouteDocuments(routeId: string): Promise<RouteDocument[]> {
  const { data, error } = await supabase
    .from('route_documents')
    .select('*')
    .eq('route_id', routeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadRouteImages(routeId: string, files: File[]): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop();
    const path = `routes/${routeId}/${crypto.randomUUID()}.${ext}`;
    try {
      const storagePath = await uploadFile(STORAGE_BUCKETS.IMAGES, path, file);
      await supabase.from('route_images').insert({
        route_id: routeId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: i,
      });
    } catch (e) { console.error('Route image upload error:', e); }
  }
}

export async function uploadRouteDocuments(routeId: string, files: File[]): Promise<void> {
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `routes/${routeId}/${crypto.randomUUID()}.${ext}`;
    try {
      const storagePath = await uploadFile(STORAGE_BUCKETS.DOCUMENTS, path, file);
      await supabase.from('route_documents').insert({
        route_id: routeId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    } catch (e) { console.error('Route document upload error:', e); }
  }
}

export async function deleteRouteImage(id: string, storagePath: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.IMAGES, storagePath);
  const { error } = await supabase.from('route_images').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteRouteDocument(id: string, storagePath: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.DOCUMENTS, storagePath);
  const { error } = await supabase.from('route_documents').delete().eq('id', id);
  if (error) throw error;
}

export { getStorageUrl, STORAGE_BUCKETS };
