import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { NotificationBell } from '../components/NotificationBell';
import { AiDrawerTrigger } from '../components/tasks/AiDrawerTrigger';

export const metadata = {
  title: 'TaskVIKS Tracker',
  description: 'Minimalistic task-tracking app with Supabase'
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { data: profile } = session
    ? await supabase.from('users').select('full_name, avatar_url, role').eq('id', session.user.id).single()
    : { data: null };

  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-slate-900">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border bg-panel py-3 px-6 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              TaskVIKS Tracker
            </Link>
            <div className="flex items-center gap-3">
              {session && <AiDrawerTrigger role={profile?.role ?? 'worker'} />}
              {session && <NotificationBell userId={session.user.id} />}
              {session ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Avatar fallback={profile?.full_name?.[0] ?? 'U'} src={profile?.avatar_url} />
                  <div className="text-right leading-tight">
                    <div className="text-slate-900 font-medium">{profile?.full_name ?? 'User'}</div>
                    <div className="text-xs text-muted">{profile?.role ?? 'worker'}</div>
                  </div>
                </div>
              ) : (
                <Button asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
