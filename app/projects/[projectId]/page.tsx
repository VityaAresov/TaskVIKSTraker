import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProjectBoard } from '../../../components/tasks/ProjectBoard';
import type { Task } from '../../../components/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function ProjectBoardPage({ params }: { params: { projectId: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: project } = await supabase.from('projects').select('id').eq('id', params.projectId).single();
  if (!project) return notFound();

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      'id,title,description,status,progress_current,progress_target,due_date,parent_task_id,task_assignees(user_id, users(id, full_name, avatar_url)), task_dependencies(depends_on_task_id), task_comments(count)'
    )
    .eq('project_id', params.projectId);

  const { data: users } = await supabase.from('users').select('id, full_name, role');

  const childCount = (tasks ?? []).reduce<Record<string, number>>((acc, task) => {
    if (task.parent_task_id) {
      acc[task.parent_task_id] = (acc[task.parent_task_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  const boardTasks: (Task & { assigneeIds: string[] })[] = (tasks ?? []).map((task) => {
    const assignees = (task.task_assignees ?? [])
      .map((ta: any) => ta.users)
      .filter(Boolean)
      .map((u: any) => ({ id: u.id, name: u.full_name, avatar_url: u.avatar_url }));

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      progress_current: task.progress_current ?? 0,
      progress_target: task.progress_target ?? 100,
      assignees,
      due_date: task.due_date,
      depends_on: (task.task_dependencies ?? []).map((d: any) => d.depends_on_task_id),
      comments_count: task.task_comments?.[0]?.count ?? 0,
      has_children: Boolean(childCount[task.id]),
      start_date: undefined,
      assigneeIds: assignees.map((a) => a.id)
    };
  });

  const role = users?.find((u) => u.id === session.user.id)?.role ?? 'worker';

  return <ProjectBoard tasks={boardTasks} role={role} currentUserId={session.user.id} />;
}
