'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const run = async () => {
      // 1️⃣ Exchange code/hash for a session
      if (typeof window !== 'undefined') {
        const url = window.location.href;
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          console.log('exchangeCodeForSession', { data, error });
        } catch (err) {
          console.warn('exchangeCodeForSession threw', err);
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('getSession in /auth/callback', { session: sessionData, sessionError });
      }

      const redirectedFrom = searchParams.get('redirectedFrom');
      router.replace(redirectedFrom || '/');
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-gray-600">Finishing sign-in, please wait…</p>
    </div>
  );
}
