import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient as createServerSupabaseClient, ensureSupabaseEnv } from './supabaseServer';

export class SupabaseEnvError extends Error {}

function getSupabaseEnv() {
  const { supabaseUrl, supabaseAnonKey } = ensureSupabaseEnv();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export const createSupabaseBrowserClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserSupabaseClient({ supabaseUrl, supabaseKey: supabaseAnonKey });
};

export const createSupabaseServerClient = () => {
  return createServerSupabaseClient();
};

export const createServiceRoleClient = () => {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};
