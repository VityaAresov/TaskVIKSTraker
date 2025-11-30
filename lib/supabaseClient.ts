import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const createSupabaseBrowserClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      }
    }
  });
};

export const createServiceRoleClient = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {
        return undefined;
      },
      remove() {
        return undefined;
      }
    }
  });
};
