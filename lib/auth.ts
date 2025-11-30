import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './supabaseClient';
import { type User } from '@supabase/supabase-js';

export type AppRole = 'worker' | 'manager' | 'owner';

export type AppUser = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: AppRole;
};

export async function getSessionUser(): Promise<{ user: User | null }> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { user };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { user } = await getSessionUser();
  if (!user) return null;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', user.id)
    .single();
  return data ?? null;
}

export async function requireRole(minRole: AppRole) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const precedence: Record<AppRole, number> = { worker: 0, manager: 1, owner: 2 };
  if (precedence[user.role] < precedence[minRole]) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  cookieStore.set('sb-access-token', accessToken, { path: '/', httpOnly: true });
  cookieStore.set('sb-refresh-token', refreshToken, { path: '/', httpOnly: true });
}
