import { supabase } from '../supabase';

export async function voteRoute(
  routeId: string,
  username: string,
  voteType: 'up' | 'down'
): Promise<void> {
  const { error } = await supabase
    .from('route_votes')
    .upsert(
      { route_id: routeId, username, vote_type: voteType },
      { onConflict: 'route_id,username' }
    );

  if (error) throw error;
  await recalculateRouteVotes(routeId);
}

export async function removeRouteVote(
  routeId: string,
  username: string
): Promise<void> {
  const { error } = await supabase
    .from('route_votes')
    .delete()
    .eq('route_id', routeId)
    .eq('username', username);

  if (error) throw error;
  await recalculateRouteVotes(routeId);
}

export async function getUserRouteVote(
  routeId: string,
  username: string
): Promise<'up' | 'down' | null> {
  const { data, error } = await supabase
    .from('route_votes')
    .select('vote_type')
    .eq('route_id', routeId)
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return (data?.vote_type as 'up' | 'down') ?? null;
}

export async function getRouteVoteCounts(
  routeId: string
): Promise<{ up: number; down: number }> {
  const { data, error } = await supabase
    .from('route_votes')
    .select('vote_type')
    .eq('route_id', routeId);

  if (error) throw error;
  const votes = data || [];
  return {
    up: votes.filter(v => v.vote_type === 'up').length,
    down: votes.filter(v => v.vote_type === 'down').length,
  };
}

async function recalculateRouteVotes(routeId: string): Promise<void> {
  const counts = await getRouteVoteCounts(routeId);
  await supabase
    .from('routes')
    .update({ votes_up: counts.up, votes_down: counts.down })
    .eq('id', routeId);
}
