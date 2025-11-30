import { redirect } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './supabaseServer';

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
    console.error('Failed to resolve Supabase session', error);
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
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', session.user.id)
    .single();

  if (!data) {
    redirect('/login');
  }

  return data;
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}
