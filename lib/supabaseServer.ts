import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies });
}

export function getSupabaseServerClient() {
  return createSupabaseServerClient();
}
