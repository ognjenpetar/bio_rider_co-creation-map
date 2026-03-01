import { supabase } from '../supabase';

export async function voteLocation(
  locationId: string,
  username: string,
  voteType: 'up' | 'down'
): Promise<void> {
  // Upsert the vote (one vote per user per location)
  const { error } = await supabase
    .from('location_votes')
    .upsert(
      { location_id: locationId, username, vote_type: voteType },
      { onConflict: 'location_id,username' }
    );

  if (error) throw error;

  await recalculateVotes(locationId);
}

export async function removeVote(
  locationId: string,
  username: string
): Promise<void> {
  const { error } = await supabase
    .from('location_votes')
    .delete()
    .eq('location_id', locationId)
    .eq('username', username);

  if (error) throw error;

  await recalculateVotes(locationId);
}

export async function getUserVote(
  locationId: string,
  username: string
): Promise<'up' | 'down' | null> {
  const { data, error } = await supabase
    .from('location_votes')
    .select('vote_type')
    .eq('location_id', locationId)
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return (data?.vote_type as 'up' | 'down') ?? null;
}

export async function getLocationVoteCounts(
  locationId: string
): Promise<{ up: number; down: number }> {
  const { data, error } = await supabase
    .from('location_votes')
    .select('vote_type')
    .eq('location_id', locationId);

  if (error) throw error;

  const votes = data || [];
  return {
    up: votes.filter(v => v.vote_type === 'up').length,
    down: votes.filter(v => v.vote_type === 'down').length,
  };
}

async function recalculateVotes(locationId: string): Promise<void> {
  const counts = await getLocationVoteCounts(locationId);

  await supabase
    .from('locations')
    .update({ votes_up: counts.up, votes_down: counts.down })
    .eq('id', locationId);
}
