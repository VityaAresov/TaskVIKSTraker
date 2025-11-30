'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuth = async () => {
      // This reads the hash fragment and establishes the Supabase session
      await supabase.auth.getSession();
      router.replace('/');
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-gray-600">Logging you in…</p>
    </div>
  );
}
