'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '../../../lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      const url = typeof window !== 'undefined' ? window.location.href : '';

      let exchangeResult: any = null;
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        exchangeResult = { data, error };
        console.log('exchangeCodeForSession', exchangeResult);
      } catch (err) {
        console.warn('exchangeCodeForSession threw', err);
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('getSession in /auth/callback', {
        session: sessionData,
        sessionError
      });

      setDebug({
        exchangeResult,
        session: sessionData,
        sessionError
      });

      const redirectedFrom = searchParams.get('redirectedFrom');
      router.replace(redirectedFrom || '/');
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-sm text-gray-600">Finishing sign-in, please wait…</p>
      <pre className="max-w-xl overflow-auto rounded bg-gray-100 p-3 text-[10px] text-gray-700">
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  );
}
