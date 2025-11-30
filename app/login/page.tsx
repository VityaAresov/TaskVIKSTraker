'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient, SupabaseEnvError } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setStatus('Check your email for a magic link to sign in.');
      }
    } catch (err) {
      if (err instanceof SupabaseEnvError || err instanceof Error) {
        setError(err.message || 'Unable to start email sign-in.');
      } else {
        setError('Unable to start email sign-in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { url },
        error: oauthError
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (oauthError) {
        setError(oauthError.message);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      if (err instanceof SupabaseEnvError || err instanceof Error) {
        setError(err.message || 'Unable to start Google sign-in.');
      } else {
        setError('Unable to start Google sign-in.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-2xl font-semibold">Sign in</div>
          <div className="text-muted text-sm">Use your work email. We will send you a magic link.</div>
        </div>

        <form className="space-y-3" onSubmit={handleEmailSignIn}>
          <label className="text-sm font-medium text-left block">Email</label>
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Continue with email'}
          </Button>
        </form>

        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="flex-1 h-px bg-border" />
          <span>or</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <Button
          className="w-full bg-panel text-foreground border border-border hover:bg-muted"
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </Button>

        {status ? <div className="text-green-600 text-xs text-center">{status}</div> : null}
        {error ? <div className="text-red-600 text-xs text-center">{error}</div> : null}
      </div>
    </div>
  );
}
