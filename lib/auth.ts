import { cookies } from 'next/headers';
import { SupabaseEnvError, createSupabaseServerClient } from './supabaseClient';
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
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return { user };
  } catch (error) {
    if (error instanceof SupabaseEnvError) {
      console.error('Supabase environment variables are missing or invalid', error.message);
    } else {
      console.error('Failed to resolve Supabase session', error);
    }
    return { user: null };
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { user } = await getSessionUser();
  if (!user) return null;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role')
      .eq('id', user.id)
      .single();
    return data ?? null;
  } catch (error) {
    console.error('Failed to load current user', error);
    return null;
  }
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
