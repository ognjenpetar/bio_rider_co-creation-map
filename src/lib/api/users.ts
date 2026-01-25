import { supabase } from '../supabase';
import type { Profile, UserRole } from '../../types';

// Get all users (admin only)
export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get single user profile
export async function getUser(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// Update user role (superadmin only)
export async function updateUserRole(userId: string, role: UserRole): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update user profile
export async function updateProfile(
  userId: string,
  data: { full_name?: string; avatar_url?: string }
): Promise<Profile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return profile;
}

// Get users by role
export async function getUsersByRole(role: UserRole): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get user statistics
export async function getUserStats(): Promise<{
  total: number;
  byRole: Record<UserRole, number>;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role');

  if (error) throw error;

  const byRole = (data || []).reduce(
    (acc, user) => {
      acc[user.role as UserRole] = (acc[user.role as UserRole] || 0) + 1;
      return acc;
    },
    { superadmin: 0, admin: 0, editor: 0, viewer: 0 } as Record<UserRole, number>
  );

  return {
    total: data?.length || 0,
    byRole,
  };
}
