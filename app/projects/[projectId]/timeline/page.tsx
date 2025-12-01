import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export default async function TimelinePage({ params }: { params: { projectId: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: project } = await supabase.from('projects').select('name').eq('id', params.projectId).single();

  return (
    <div className="rounded-lg border border-border bg-panel p-6 shadow-sm">
      <div className="text-lg font-semibold">Timeline for {project?.name ?? 'project'}</div>
      <p className="text-sm text-muted mt-2">Detailed timeline coming soon.</p>
    </div>
  );
}
