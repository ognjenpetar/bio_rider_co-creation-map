import { supabase } from '../supabase';
import { uploadFile, deleteFile, getStorageUrl, STORAGE_BUCKETS } from '../supabase';

export interface ZoneImage {
  id: string;
  zone_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
}

export interface ZoneDocument {
  id: string;
  zone_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_by: string | null;
  created_at: string;
}

export async function getZoneImages(zoneId: string): Promise<ZoneImage[]> {
  const { data, error } = await supabase
    .from('zone_images')
    .select('*')
    .eq('zone_id', zoneId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getZoneDocuments(zoneId: string): Promise<ZoneDocument[]> {
  const { data, error } = await supabase
    .from('zone_documents')
    .select('*')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadZoneImages(zoneId: string, files: File[]): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop();
    const path = `zones/${zoneId}/${crypto.randomUUID()}.${ext}`;
    try {
      const storagePath = await uploadFile(STORAGE_BUCKETS.IMAGES, path, file);
      await supabase.from('zone_images').insert({
        zone_id: zoneId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: i,
      });
    } catch (e) { console.error('Zone image upload error:', e); }
  }
}

export async function uploadZoneDocuments(zoneId: string, files: File[]): Promise<void> {
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `zones/${zoneId}/${crypto.randomUUID()}.${ext}`;
    try {
      const storagePath = await uploadFile(STORAGE_BUCKETS.DOCUMENTS, path, file);
      await supabase.from('zone_documents').insert({
        zone_id: zoneId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    } catch (e) { console.error('Zone document upload error:', e); }
  }
}

export async function deleteZoneImage(id: string, storagePath: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.IMAGES, storagePath);
  const { error } = await supabase.from('zone_images').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteZoneDocument(id: string, storagePath: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.DOCUMENTS, storagePath);
  const { error } = await supabase.from('zone_documents').delete().eq('id', id);
  if (error) throw error;
}

export { getStorageUrl, STORAGE_BUCKETS };
