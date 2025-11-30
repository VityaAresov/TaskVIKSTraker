export class SupabaseEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseEnvError';
  }
}

export function resolveSupabasePublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new SupabaseEnvError(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local'
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}

export function resolveSupabaseServiceKey() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    throw new SupabaseEnvError('SUPABASE_SERVICE_ROLE_KEY must be set for service operations');
  }
  return supabaseServiceRoleKey;
}
