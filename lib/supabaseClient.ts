import { createClient } from '@supabase/supabase-js';
import { resolveSupabasePublicEnv, resolveSupabaseServiceKey, SupabaseEnvError } from './supabaseEnv';

let browserClient: ReturnType<typeof createClient> | null = null;

function getPublicClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = resolveSupabasePublicEnv();
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

export const supabaseBrowser = getPublicClient;

export function createServiceRoleClient() {
  const { supabaseUrl } = resolveSupabasePublicEnv();
  const serviceRoleKey = resolveSupabaseServiceKey();
  return createClient(supabaseUrl, serviceRoleKey);
}

export { SupabaseEnvError };
