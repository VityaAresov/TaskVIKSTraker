import { ProjectBoard } from '../../../components/tasks/ProjectBoard';
import { SubprojectSwitcher } from '../../../components/tasks/SubprojectSwitcher';
import { fetchProjectColumnLabels, fetchWorkspaceTasks } from '../../../lib/workspaceData';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import type { WorkspaceTask } from '../../../lib/workspaceTypes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ProjectPageProps = {
  params: { projectId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

type ProjectRow = {
  id: number;
  name: string;
  description?: string | null;
  column_backlog_label?: string | null;
  column_todo_label?: string | null;
  column_in_progress_label?: string | null;
  column_blocked_label?: string | null;
  column_done_label?: string | null;
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const projectId = Number(params.projectId);
  if (!Number.isFinite(projectId)) {
    console.error('[project page] invalid project id', params.projectId);
    return <ErrorBanner message="Invalid project id." />;
  }

  const supabase = getSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle<ProjectRow>();

  if (projectError) {
    console.error('[project page] failed to load project', { projectId, error: projectError });
    return (
      <ErrorBanner message="We could not load this project. Please try again later or contact support." />
    );
  }

  if (!project) {
    console.error('[project page] project not found', { projectId });
    return <ErrorBanner message="Project not found or you don’t have access." />;
  }

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[project page] failed to read session', sessionError);
  }

  if (!session) {
    return <ErrorBanner message="We could not load this project. Please try again later or contact support." />;
  }

  const baseProjectId = typeof project.id === 'number' ? project.id : Number(project.id);

  const columnLabels = await fetchProjectColumnLabels(baseProjectId, supabase, project as any);

  const { data: subprojectsData, error: subprojectsError } = await supabase
    .from('projects')
    .select('id, name, parent_project_id')
    .eq('parent_project_id', baseProjectId);

  if (subprojectsError) {
    console.error('[project page] failed to load subprojects', subprojectsError);
  }

  const subprojects = subprojectsData ?? [];

  const [tasks, usersResp] = await Promise.all([
    fetchWorkspaceTasks(baseProjectId, supabase) as Promise<WorkspaceTask[]>,
    supabase.from('users').select('id, full_name, role, avatar_url')
  ]);

  const users = usersResp.data ?? [];

  if (usersResp.error) {
    console.error('[project page] failed to load users for project board', usersResp.error);
  }

  const role = users.find((u) => u.id === session.user.id)?.role ?? 'worker';

  return (
    <>
      <SubprojectSwitcher projectId={baseProjectId} subprojects={subprojects} role={role} />
      <ProjectBoard
        tasks={tasks}
        role={role}
        currentUserId={session.user.id}
        users={users}
        workspaceId={baseProjectId}
        columnLabels={columnLabels}
        projectId={baseProjectId}
      />
    </>
  );
}
