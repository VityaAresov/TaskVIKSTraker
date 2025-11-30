'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveSiteUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  };

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const siteUrl = resolveSiteUrl();

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`
      }
    });

    setLoading(false);

    if (signInError) {
      console.error('Error sending magic link', signInError);
      setError('Error sending magic link, please try again.');
      return;
    }

    setMessage('Check your email for the magic link.');
  };

  const handleGoogle = async () => {
    setError(null);
    const siteUrl = resolveSiteUrl();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });

    if (error) {
      console.error('Error with Google sign-in', error);
      setError('Unable to start Google sign-in.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-2xl font-semibold">Sign in</div>
          <div className="text-muted text-sm">Use your work email. We will send you a magic link.</div>
        </div>

        <form className="space-y-3" onSubmit={handleMagicLink}>
          <label className="text-sm font-medium text-left block">Email</label>
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Continue with email'}
          </Button>
        </form>

        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="flex-1 h-px bg-border" />
          <span>or</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <Button
          className="w-full bg-panel text-foreground border border-border hover:bg-muted"
          onClick={handleGoogle}
        >
          Continue with Google
        </Button>

        {message ? <div className="text-green-600 text-xs text-center">{message}</div> : null}
        {error ? <div className="text-red-600 text-xs text-center">{error}</div> : null}
      </div>
    </div>
  );
}
