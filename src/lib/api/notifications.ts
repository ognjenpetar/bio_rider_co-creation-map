import { supabase } from '../supabase';
import type { Notification } from '../../types';

export async function getNotifications(username: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(username: string): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('username', username)
    .eq('is_read', false);

  if (error) throw error;
  return data?.length || 0;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllAsRead(username: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('username', username)
    .eq('is_read', false);

  if (error) throw error;
}

export async function createNotification(data: {
  username: string;
  type: Notification['type'];
  title: string;
  message?: string;
  reference_id?: string;
}): Promise<void> {
  await supabase
    .from('notifications')
    .insert({
      username: data.username,
      type: data.type,
      title: data.title,
      message: data.message || null,
      reference_id: data.reference_id || null,
    });
}

// Broadcast notification to all users except sender
export async function broadcastNotification(
  excludeUsername: string,
  data: {
    type: Notification['type'];
    title: string;
    message?: string;
    reference_id?: string;
  }
): Promise<void> {
  // Get distinct usernames from locations
  const { data: users } = await supabase
    .from('locations')
    .select('created_by')
    .not('created_by', 'is', null);

  const uniqueUsers = [...new Set(
    (users || []).map(u => u.created_by).filter(Boolean)
  )].filter(u => u !== excludeUsername);

  const notifications = uniqueUsers.map(username => ({
    username: username!,
    type: data.type,
    title: data.title,
    message: data.message || null,
    reference_id: data.reference_id || null,
  }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}
