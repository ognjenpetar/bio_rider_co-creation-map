import { supabase } from '../supabase';

export interface UserBan {
  id: string;
  username: string;
  ban_type: 'permanent' | 'temporary';
  ban_until: string | null;
  reason: string | null;
  banned_by: string;
  created_at: string;
}

export interface UserSummary {
  username: string;
  locations: number;
  routes: number;
  zones: number;
  comments: number;
  votes: number;
  ban: UserBan | null;
}

export async function listUsers(): Promise<UserSummary[]> {
  const [locs, routes, zones, locComments, routeComments, zoneComments, locVotes, routeVotes, zoneVotes, bans] = await Promise.all([
    supabase.from('locations').select('created_by').eq('is_active', true),
    supabase.from('routes').select('created_by').eq('is_active', true),
    supabase.from('zones').select('created_by').eq('is_active', true),
    supabase.from('location_comments').select('username'),
    supabase.from('route_comments').select('username'),
    supabase.from('zone_comments').select('username'),
    supabase.from('location_votes').select('username'),
    supabase.from('route_votes').select('username'),
    supabase.from('zone_votes').select('username'),
    supabase.from('user_bans').select('*'),
  ]);

  const banMap = new Map<string, UserBan>();
  (bans.data || []).forEach(b => banMap.set(b.username.toLowerCase(), b as UserBan));

  const counters = new Map<string, UserSummary>();
  const get = (u: string) => {
    const key = u.toLowerCase();
    if (!counters.has(key)) counters.set(key, { username: u, locations: 0, routes: 0, zones: 0, comments: 0, votes: 0, ban: banMap.get(key) || null });
    return counters.get(key)!;
  };

  (locs.data || []).forEach(r => r.created_by && get(r.created_by).locations++);
  (routes.data || []).forEach(r => r.created_by && get(r.created_by).routes++);
  (zones.data || []).forEach(r => r.created_by && get(r.created_by).zones++);
  (locComments.data || []).forEach(r => r.username && get(r.username).comments++);
  (routeComments.data || []).forEach(r => r.username && get(r.username).comments++);
  (zoneComments.data || []).forEach(r => r.username && get(r.username).comments++);
  (locVotes.data || []).forEach(r => r.username && get(r.username).votes++);
  (routeVotes.data || []).forEach(r => r.username && get(r.username).votes++);
  (zoneVotes.data || []).forEach(r => r.username && get(r.username).votes++);

  return Array.from(counters.values()).sort((a, b) =>
    (b.locations + b.routes + b.zones + b.comments + b.votes) - (a.locations + a.routes + a.zones + a.comments + a.votes)
  );
}

export async function banUser(username: string, ban_type: 'permanent' | 'temporary', ban_until: string | null, reason: string): Promise<void> {
  const { error } = await supabase.from('user_bans').upsert({
    username,
    ban_type,
    ban_until: ban_until || null,
    reason: reason || null,
    banned_by: 'admin',
  }, { onConflict: 'username' });
  if (error) throw error;
}

export async function unbanUser(username: string): Promise<void> {
  const { error } = await supabase.from('user_bans').delete().eq('username', username);
  if (error) throw error;
}

export async function checkUserBan(username: string): Promise<UserBan | null> {
  const { data, error } = await supabase
    .from('user_bans')
    .select('*')
    .ilike('username', username)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  if (data.ban_type === 'temporary' && data.ban_until && new Date(data.ban_until) < new Date()) {
    await unbanUser(username);
    return null;
  }
  return data as UserBan;
}

export async function deleteAllUserEntries(username: string): Promise<void> {
  await Promise.all([
    supabase.from('locations').update({ is_active: false }).eq('created_by', username),
    supabase.from('routes').update({ is_active: false }).eq('created_by', username),
    supabase.from('zones').update({ is_active: false }).eq('created_by', username),
    supabase.from('location_comments').delete().eq('username', username),
    supabase.from('route_comments').delete().eq('username', username),
    supabase.from('zone_comments').delete().eq('username', username),
  ]);
}
