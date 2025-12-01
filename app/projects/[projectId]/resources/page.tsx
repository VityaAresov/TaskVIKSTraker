import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { fetchWorkspaceTasks } from '../../../../lib/workspaceData';
import type { WorkspaceTask } from '../../../../lib/workspaceTypes';
import { ProjectResources } from '../../../../components/tasks/ProjectResources';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResourcesPage({
  params,
  searchParams
}: {
  params: { projectId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Failed to read session in resources', sessionError);
  }

  if (!session) {
    redirect('/login');
  }

  const projectId = Number(params.projectId);
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Failed to load project for resources', projectError);
    return (
      <div className="text-sm text-muted">Unable to load this project.</div>
    );
  }

  if (!project) {
    return <div className="text-sm text-muted">Project not found.</div>;
  }

  const [tasks, usersResp] = await Promise.all([
    fetchWorkspaceTasks(projectId, supabase) as Promise<WorkspaceTask[]>,
    supabase.from('users').select('id, full_name, role, avatar_url')
  ]);
  const users = usersResp.data ?? [];
  const role = users.find((u) => u.id === session.user.id)?.role ?? 'worker';

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Resources for {project.name}</div>
      <ProjectResources tasks={tasks} users={users} role={role} currentUserId={session.user.id} />
    </div>
  );
}
