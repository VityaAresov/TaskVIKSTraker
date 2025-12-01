import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { ReactNode } from 'react';
import { ProjectTabs } from '../../../components/tasks/ProjectTabs';
import { SubprojectSwitcher } from '../../../components/tasks/SubprojectSwitcher';

export const dynamic = 'force-dynamic';

export default async function ProjectLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { projectId: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [{ data: project }, { data: subprojects }, { data: user }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.projectId).single(),
    supabase.from('projects').select('*').eq('parent_project_id', params.projectId),
    supabase.from('users').select('role').eq('id', session.user.id).single()
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-xs text-muted hover:underline">
          ← Back to dashboard
        </Link>
        <div className="text-xs text-muted">Project workspace</div>
        <div className="text-2xl font-semibold">{project.name}</div>
        <div className="text-sm text-muted">{project.description}</div>
        <SubprojectSwitcher projectId={params.projectId} subprojects={subprojects ?? []} role={user?.role ?? 'worker'} />
      </div>
      <ProjectTabs projectId={params.projectId} />
      {children}
    </div>
  );
}
