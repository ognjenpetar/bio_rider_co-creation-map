import { supabase } from '../supabase';
import type { Deliberation, DeliberationEntry, DeliberationPhase, EntryType } from '../../types';

// Deliberation CRUD
export async function getDeliberations(locationId: string): Promise<Deliberation[]> {
  const { data, error } = await supabase
    .from('deliberations')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDeliberation(id: string): Promise<Deliberation | null> {
  const { data, error } = await supabase
    .from('deliberations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createDeliberation(data: {
  location_id: string;
  title: string;
  description?: string;
  created_by: string;
  deadline?: string;
}): Promise<Deliberation> {
  const { data: delib, error } = await supabase
    .from('deliberations')
    .insert({
      location_id: data.location_id,
      title: data.title,
      description: data.description || null,
      created_by: data.created_by,
      deadline: data.deadline || null,
    })
    .select()
    .single();

  if (error) throw error;
  return delib;
}

export async function updateDeliberationPhase(
  id: string,
  phase: DeliberationPhase
): Promise<void> {
  const { error } = await supabase
    .from('deliberations')
    .update({ phase, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Entries
export async function getEntries(deliberationId: string): Promise<DeliberationEntry[]> {
  const { data, error } = await supabase
    .from('deliberation_entries')
    .select('*')
    .eq('deliberation_id', deliberationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addEntry(data: {
  deliberation_id: string;
  username: string;
  entry_type: EntryType;
  content: string;
}): Promise<DeliberationEntry> {
  const { data: entry, error } = await supabase
    .from('deliberation_entries')
    .insert({
      deliberation_id: data.deliberation_id,
      username: data.username,
      entry_type: data.entry_type,
      content: data.content,
    })
    .select()
    .single();

  if (error) throw error;
  return entry;
}

// Voting
export async function voteEntry(
  entryId: string,
  username: string,
  voteType: 'up' | 'down'
): Promise<void> {
  // Upsert the vote
  const { error: voteError } = await supabase
    .from('deliberation_votes')
    .upsert(
      { entry_id: entryId, username, vote_type: voteType },
      { onConflict: 'entry_id,username' }
    );

  if (voteError) throw voteError;

  // Recalculate counts
  const { data: votes } = await supabase
    .from('deliberation_votes')
    .select('vote_type')
    .eq('entry_id', entryId);

  const up = votes?.filter(v => v.vote_type === 'up').length || 0;
  const down = votes?.filter(v => v.vote_type === 'down').length || 0;

  await supabase
    .from('deliberation_entries')
    .update({ votes_up: up, votes_down: down })
    .eq('id', entryId);
}
