import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProjectBoard } from '../../../components/tasks/ProjectBoard';
import { fetchWorkspaceTasks } from '../../../lib/workspaceData';
import type { WorkspaceTask } from '../../../lib/workspaceTypes';

export const dynamic = 'force-dynamic';

export default async function ProjectBoardPage({
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
  const { data: project } = await supabase
    .from('projects')
    .select(
      'id, column_backlog_label, column_todo_label, column_in_progress_label, column_blocked_label, column_done_label'
    )
    .eq('id', projectId)
    .single();
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
    <ProjectBoard
      tasks={tasks}
      role={role}
      currentUserId={session.user.id}
      users={users}
      workspaceId={activeProjectId}
      columnLabels={{
        backlog: project.column_backlog_label ?? 'Backlog',
        todo: project.column_todo_label ?? 'To Do',
        in_progress: project.column_in_progress_label ?? 'In Progress',
        blocked: project.column_blocked_label ?? 'Blocked',
        done: project.column_done_label ?? 'Done'
      }}
      projectId={projectId}
    />
  );
}
