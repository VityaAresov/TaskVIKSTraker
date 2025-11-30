import { SupabaseEnvError, createSupabaseServerClient } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  let errorMessage: string | null = null;
  let url: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { url: oauthUrl }
    } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback` }
    });
    url = oauthUrl;
  } catch (error) {
    if (error instanceof SupabaseEnvError) {
      errorMessage = 'Supabase environment variables are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    } else {
      errorMessage = 'Unable to initiate Google sign-in. Please check Supabase configuration.';
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-md text-center space-y-4">
        <div className="text-2xl font-semibold">Sign in</div>
        <div className="text-muted text-sm">Single sign-on via Google with Supabase Auth.</div>
        <Button asChild className="w-full" disabled={!url}>
          <a href={url ?? '#'}>Continue with Google</a>
        </Button>
        {errorMessage ? <div className="text-xs text-red-600">{errorMessage}</div> : null}
      </div>
    </div>
  );
}
