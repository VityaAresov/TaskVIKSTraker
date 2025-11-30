import { createBrowserSupabaseClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export const createSupabaseBrowserClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserSupabaseClient({ supabaseUrl, supabaseKey: supabaseAnonKey });
};

export const createSupabaseServerClient = () => {
  // Supabase helpers read credentials from the environment; we validate eagerly for clearer errors.
  getSupabaseEnv();
  return createServerComponentClient({ cookies });
};

export const createServiceRoleClient = () => {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};
