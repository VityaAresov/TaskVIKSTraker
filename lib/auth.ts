import { redirect } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { SupabaseEnvError, createSupabaseServerClient } from './supabaseClient';

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

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}
