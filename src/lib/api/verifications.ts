import { supabase } from '../supabase';
import type { LocationVerification } from '../../types';

export async function getVerifications(locationId: string): Promise<LocationVerification[]> {
  const { data, error } = await supabase
    .from('location_verifications')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getVerificationCount(locationId: string): Promise<number> {
  const { data, error } = await supabase
    .from('location_verifications')
    .select('id')
    .eq('location_id', locationId)
    .eq('verified', true);

  if (error) throw error;
  return data?.length || 0;
}

export async function hasUserVerified(locationId: string, username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('location_verifications')
    .select('id')
    .eq('location_id', locationId)
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function verifyLocation(data: {
  location_id: string;
  username: string;
  comment?: string;
}): Promise<LocationVerification> {
  const { data: verification, error } = await supabase
    .from('location_verifications')
    .insert({
      location_id: data.location_id,
      username: data.username,
      verified: true,
      comment: data.comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return verification;
}

export async function removeVerification(locationId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from('location_verifications')
    .delete()
    .eq('location_id', locationId)
    .eq('username', username);

  if (error) throw error;
}
