import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage({
  params,
  searchParams
}: {
  params: { projectId: string };
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const activeProjectId = searchParams.subprojectId ?? params.projectId;
  const { data: project } = await supabase.from('projects').select('name').eq('id', activeProjectId).single();
  if (!project) return notFound();

  return (
    <div className="rounded-lg border border-border bg-panel p-6 shadow-sm">
      <div className="text-lg font-semibold">Resources for {project?.name ?? 'project'}</div>
      <p className="text-sm text-muted mt-2">Resource view will be built out here.</p>
    </div>
  );
}
