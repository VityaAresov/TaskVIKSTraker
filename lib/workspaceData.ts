import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { WorkspaceTask } from './workspaceTypes';

const defaultColumnLabels = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
} as const;

export async function fetchWorkspaceTasks(
  projectId: number,
  client?: any,
  subprojectId?: number | null
): Promise<WorkspaceTask[]> {
  const supabase = client ?? createServerComponentClient({ cookies });
  const hasSubproject = subprojectId !== null && subprojectId !== undefined && !Number.isNaN(subprojectId);

  const baseSelect =
    `id, project_id, sprint_id, parent_task_id, title, description, status, start_date, due_date,
     progress_current, progress_target, progress_total, priority, visible_to_role, visible_to_user_ids,
     task_assignees(user_id, users(id, full_name, avatar_url, role)),
     task_dependencies(depends_on_task_id),
     task_comments(id)`;

  const runQuery = async (withSubproject: boolean) => {
    let select = baseSelect;
    let query = supabase.from('tasks').select(select).eq('project_id', projectId).order('id', { ascending: true });

    if (withSubproject && hasSubproject) {
      select = `${baseSelect}, subproject_id`;
      query = supabase.from('tasks').select(select).eq('project_id', projectId).order('id', { ascending: true });
      query = query.eq('subproject_id', subprojectId);
    } else if (withSubproject) {
      select = `${baseSelect}, subproject_id`;
      query = supabase.from('tasks').select(select).eq('project_id', projectId).order('id', { ascending: true });
      query = query.is('subproject_id', null);
    }

    return query;
  };

  let { data, error } = await runQuery(true);

  if (error && error.message.includes('subproject_id')) {
    console.warn('[workspace tasks] subproject_id missing, retrying without subproject filter');
    const fallback = await runQuery(false);
    ({ data, error } = await fallback);
  }

  if (error && error.message.toLowerCase().includes('column')) {
    console.warn('[workspace tasks] column mismatch, falling back to select *', { error });
    const fallback = supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: true });
    if (hasSubproject) {
      fallback.eq('subproject_id', subprojectId as any);
    }
    ({ data, error } = await fallback);
  }

  if (error) {
    console.error('Failed to load workspace tasks', { projectId, subprojectId, error });
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
      subproject_id: task.subproject_id === null || task.subproject_id === undefined ? null : Number(task.subproject_id),
      title: task.title,
      description: task.description,
      status: task.status,
      progress_current: task.progress_current ?? 0,
      progress_target: task.progress_target ?? task.progress_total ?? 100,
      priority: task.priority,
      visible_to_role: task.visible_to_role,
      visible_to_user_ids: task.visible_to_user_ids,
      sprint_id: task.sprint_id,
      parent_task_id: task.parent_task_id ? String(task.parent_task_id) : null,
      start_date: task.start_date,
      due_date: task.due_date,
      assignees,
      assigneeIds: assignees.map((a: { id: string }) => a.id),
      depends_on: (task.task_dependencies ?? []).map((d: { depends_on_task_id: string | number }) =>
        String(d.depends_on_task_id)
      ),
      comments_count: (task.task_comments ?? []).length,
      has_children: Boolean(childCount[task.id])
    } satisfies WorkspaceTask;
  });
}

export async function fetchProjectColumnLabels(
  projectId: number,
  client?: any,
  projectRow?: Partial<{ [K in keyof typeof defaultColumnLabels as `column_${K}_label`]: string | null }>
) {
  const supabase = client ?? createServerComponentClient({ cookies });
  const seedLabels = {
    backlog: projectRow?.column_backlog_label ?? defaultColumnLabels.backlog,
    todo: projectRow?.column_todo_label ?? defaultColumnLabels.todo,
    in_progress: projectRow?.column_in_progress_label ?? defaultColumnLabels.in_progress,
    blocked: projectRow?.column_blocked_label ?? defaultColumnLabels.blocked,
    done: projectRow?.column_done_label ?? defaultColumnLabels.done
  };

  const { data, error } = await supabase
    .from('project_columns')
    .select('key,label')
    .eq('project_id', projectId);

  if (error) {
    console.error('[project columns] failed to load labels', { projectId, error });
    return seedLabels;
  }

  if (!data || data.length === 0) {
    await supabase.from('project_columns').upsert(
      Object.entries(seedLabels).map(([key, label], index) => ({
        project_id: projectId,
        key,
        label,
        order: index
      }))
    );
    return seedLabels;
  }

  return (data as { key: string; label: string | null }[]).reduce<Record<keyof typeof seedLabels, string>>((acc, row) => {
    const key = row.key as keyof typeof seedLabels;
    if (key in acc && row.label) acc[key] = row.label;
    return acc;
  }, { ...seedLabels });
}
