import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { fetchWorkspaceTasks } from '../../../../lib/workspaceData';
import type { WorkspaceTask } from '../../../../lib/workspaceTypes';
import { ProjectCalendar } from '../../../../components/tasks/ProjectCalendar';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({
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

  const projectId = Number(params.projectId);
  const { data: project } = await supabase.from('projects').select('id, name').eq('id', projectId).single();
  if (!project) return notFound();

  const parsedSub = searchParams.subprojectId ? Number(searchParams.subprojectId) : NaN;
  const activeProjectId = Number.isNaN(parsedSub) ? projectId : parsedSub;

  const [tasks, usersResp] = await Promise.all([
    fetchWorkspaceTasks(activeProjectId, supabase) as Promise<WorkspaceTask[]>,
    supabase.from('users').select('id, full_name, role, avatar_url')
  ]);
  const users = usersResp.data ?? [];
  const role = users.find((u) => u.id === session.user.id)?.role ?? 'worker';

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Calendar for {project.name}</div>
      <ProjectCalendar
        tasks={tasks}
        users={users}
        role={role}
        currentUserId={session.user.id}
        workspaceId={activeProjectId}
      />
    </div>
  );
}
