import { supabase } from '../supabase';

export async function voteZone(
  zoneId: string,
  username: string,
  voteType: 'up' | 'down'
): Promise<void> {
  const { error } = await supabase
    .from('zone_votes')
    .upsert(
      { zone_id: zoneId, username, vote_type: voteType },
      { onConflict: 'zone_id,username' }
    );

  if (error) throw error;
  await recalculateZoneVotes(zoneId);
}

export async function removeZoneVote(
  zoneId: string,
  username: string
): Promise<void> {
  const { error } = await supabase
    .from('zone_votes')
    .delete()
    .eq('zone_id', zoneId)
    .eq('username', username);

  if (error) throw error;
  await recalculateZoneVotes(zoneId);
}

export async function getUserZoneVote(
  zoneId: string,
  username: string
): Promise<'up' | 'down' | null> {
  const { data, error } = await supabase
    .from('zone_votes')
    .select('vote_type')
    .eq('zone_id', zoneId)
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return (data?.vote_type as 'up' | 'down') ?? null;
}

export async function getZoneVoteCounts(
  zoneId: string
): Promise<{ up: number; down: number }> {
  const { data, error } = await supabase
    .from('zone_votes')
    .select('vote_type')
    .eq('zone_id', zoneId);

  if (error) throw error;
  const votes = data || [];
  return {
    up: votes.filter(v => v.vote_type === 'up').length,
    down: votes.filter(v => v.vote_type === 'down').length,
  };
}

async function recalculateZoneVotes(zoneId: string): Promise<void> {
  const counts = await getZoneVoteCounts(zoneId);
  await supabase
    .from('zones')
    .update({ votes_up: counts.up, votes_down: counts.down })
    .eq('id', zoneId);
}
