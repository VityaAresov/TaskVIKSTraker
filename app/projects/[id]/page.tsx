import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProjectWorkspace } from '../../../components/tasks/ProjectWorkspace';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  if (!params.id) return notFound();

  const [{ data: project }, { data: tasks }, { data: sprints }, { data: users }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase
      .from('tasks')
      .select('*, task_assignees(user_id), task_dependencies(depends_on_task_id), task_comments(count)')
      .eq('project_id', params.id),
    supabase.from('sprints').select('id, name').eq('project_id', params.id),
    supabase.from('users').select('id, full_name, role, avatar_url')
  ]);

  if (!project) return notFound();

  const role = users?.find((u) => u.id === session.user.id)?.role ?? 'worker';

  return (
    <div className="container-page space-y-4">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted">Project</div>
        <div className="text-2xl font-semibold">{project.name}</div>
        <div className="text-sm text-muted">{project.description}</div>
      </div>

      <ProjectWorkspace
        tasks={tasks ?? []}
        sprints={sprints ?? []}
        users={users ?? []}
        projectId={params.id}
        role={role}
        currentUserId={session.user.id}
      />
    </div>
  );
}
