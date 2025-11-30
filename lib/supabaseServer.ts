import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ensureSupabaseEnv } from './supabaseEnv';

export function createSupabaseServerClient() {
  ensureSupabaseEnv();
  return createServerComponentClient({ cookies });
}
