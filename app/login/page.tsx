import { createSupabaseServerClient } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { url }
  } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback` } });

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-md text-center space-y-4">
        <div className="text-2xl font-semibold">Sign in</div>
        <div className="text-muted text-sm">Single sign-on via Google with Supabase Auth.</div>
        <Button asChild className="w-full">
          <a href={url ?? '#'}>Continue with Google</a>
        </Button>
      </div>
    </div>
  );
}
