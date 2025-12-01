import { redirect } from 'next/navigation';
import { ProjectBoard } from '../../../components/tasks/ProjectBoard';
import { fetchWorkspaceTasks } from '../../../lib/workspaceData';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import type { WorkspaceTask } from '../../../lib/workspaceTypes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectBoardPage({
  params,
  searchParams
}: {
  params: { projectId: string };
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Failed to read session in project page', sessionError);
  }

  if (!session) {
    redirect('/login');
  }

  const projectId = Number(params.projectId);
  if (Number.isNaN(projectId)) {
    throw new Error('Invalid project id');
  }

  const {
    data: project,
    error: projectError
  } = await supabase
    .from('projects')
    .select(
      'id, column_backlog_label, column_todo_label, column_in_progress_label, column_blocked_label, column_done_label'
    )
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    console.error('[project page] Failed to load project', { projectId, error: projectError });
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        We could not load this project. Please try again later or contact support.
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-sm text-muted">Project not found or you don’t have access.</div>
    );
  }

  const parsedSub = searchParams.subprojectId ? Number(searchParams.subprojectId) : NaN;
  const baseProjectId = typeof project.id === 'number' ? project.id : Number(project.id);
  const activeProjectId = Number.isNaN(parsedSub) ? baseProjectId : parsedSub;

  const [tasks, usersResp] = await Promise.all([
    fetchWorkspaceTasks(activeProjectId, supabase) as Promise<WorkspaceTask[]>,
    supabase.from('users').select('id, full_name, role, avatar_url')
  ]);
  const users = usersResp.data ?? [];

  if (usersResp.error) {
    console.error('Failed to load users for project board', usersResp.error);
  }

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
      projectId={baseProjectId}
    />
  );
}
