import { cookies } from 'next/headers';
import { createServerComponentClient as createServerClient } from '@supabase/auth-helpers-nextjs';
import { resolveSupabasePublicEnv, SupabaseEnvError } from './supabaseEnv';

export function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabasePublicEnv();
  try {
    return createServerClient({ cookies }, { supabaseUrl, supabaseKey: supabaseAnonKey });
  } catch (error) {
    if (error instanceof SupabaseEnvError) {
      throw error;
    }
    throw new Error('Failed to create Supabase server client');
  }
}
