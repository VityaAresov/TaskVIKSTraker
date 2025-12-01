import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { WorkspaceTask } from './workspaceTypes';

export async function fetchWorkspaceTasks(
  workspaceId: number,
  client?: any
): Promise<WorkspaceTask[]> {
  const supabase = client ?? createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('tasks')
    .select(
      `id, project_id, sprint_id, parent_task_id, title, description, status, start_date, due_date,
       progress_current, progress_target, priority, visible_to_role, visible_to_user_ids,
       task_assignees(user_id, users(id, full_name, avatar_url, role)),
       task_dependencies(depends_on_task_id),
       task_comments(id)`
    )
    .eq('project_id', workspaceId)
    .order('id', { ascending: true });

  if (error) {
    console.error('Failed to load workspace tasks', error);
    return [];
  }

  const childCount = (data ?? []).reduce((acc: Record<string, number>, task: any) => {
    if (task.parent_task_id) {
      acc[task.parent_task_id] = (acc[task.parent_task_id] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (data ?? []).map((task: any) => {
    const assignees = (task.task_assignees ?? [])
      .map((ta: any) => ta.users)
      .filter(Boolean)
      .map((u: any) => ({ id: u.id, name: u.full_name, avatar_url: u.avatar_url, role: u.role }));

    return {
      id: String(task.id),
      project_id: typeof task.project_id === 'number' ? task.project_id : Number(task.project_id),
      title: task.title,
      description: task.description,
      status: task.status,
      progress_current: task.progress_current ?? 0,
      progress_target: task.progress_target ?? 100,
      priority: task.priority,
      visible_to_role: task.visible_to_role,
      visible_to_user_ids: task.visible_to_user_ids,
      sprint_id: task.sprint_id,
      parent_task_id: task.parent_task_id ? String(task.parent_task_id) : null,
      start_date: task.start_date,
      due_date: task.due_date,
      assignees,
      assigneeIds: assignees.map((a: { id: string }) => a.id),
      depends_on: (task.task_dependencies ?? []).map((d: { depends_on_task_id: string | number }) => String(d.depends_on_task_id)),
      comments_count: (task.task_comments ?? []).length,
      has_children: Boolean(childCount[task.id])
    } satisfies WorkspaceTask;
  });
}
