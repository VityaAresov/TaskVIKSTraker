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

export async function fetchWorkspaceTasks(projectId: number, client?: any): Promise<WorkspaceTask[]> {
  const supabase = client ?? createServerComponentClient({ cookies });

  const baseSelect =
    'id, project_id, sprint_id, parent_task_id, title, description, status, priority, progress_current, progress_target, visible_to_role, visible_to_user_ids, due_date';

  const enrichedSelect = `${baseSelect}, task_assignees(user_id, users(id, full_name, avatar_url, role)), task_dependencies(depends_on_task_id), task_comments(id)`;

  let baseQuery = supabase.from('tasks').select(enrichedSelect).eq('project_id', projectId);

  const primary = await baseQuery.order('id', { ascending: true });

  let rows = primary.data ?? [];

  if (primary.error) {
    console.error('[workspace tasks] enriched fetch failed, falling back to base select', { projectId, error: primary.error });
    const fallbackQuery = supabase.from('tasks').select(baseSelect).eq('project_id', projectId);
    const fallback = await fallbackQuery.order('id', { ascending: true });

    if (fallback.error) {
      console.error('[workspace tasks] base fetch failed', { projectId, error: fallback.error });
      return [];
    }

    rows = fallback.data ?? [];
  }

  const childCount = (rows ?? []).reduce((acc: Record<string, number>, task: any) => {
    if (task.parent_task_id) {
      acc[task.parent_task_id] = (acc[task.parent_task_id] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // If the initial query failed to include relationships, try to hydrate lightweight assignees/comments/dependencies.
  const taskIds = (rows ?? []).map((t: any) => t.id).filter(Boolean);
  let assigneesData: any[] = [];
  if (!rows.length || rows.some((r: any) => r.task_assignees === undefined)) {
    const assigneesResp = await supabase
      .from('task_assignees')
      .select('task_id, user_id, users(id, full_name, avatar_url, role)')
      .in('task_id', taskIds);
    if (!assigneesResp.error) assigneesData = assigneesResp.data ?? [];
  }

  let dependenciesData: any[] = [];
  if (!rows.length || rows.some((r: any) => r.task_dependencies === undefined)) {
    const depsResp = await supabase
      .from('task_dependencies')
      .select('task_id, depends_on_task_id')
      .in('task_id', taskIds);
    if (!depsResp.error) dependenciesData = depsResp.data ?? [];
  }

  let commentsData: any[] = [];
  if (!rows.length || rows.some((r: any) => r.task_comments === undefined)) {
    const commentsResp = await supabase.from('task_comments').select('id, task_id').in('task_id', taskIds);
    if (!commentsResp.error) commentsData = commentsResp.data ?? [];
  }

  const assigneeMap = assigneesData.reduce<Record<string, { id: string; name: string; avatar_url?: string | null; role?: string | null }[]>>(function (acc, row: any) {
    const user = row.users;
    if (!user) return acc;
    const list = acc[row.task_id] ?? [];
    list.push({ id: user.id, name: user.full_name, avatar_url: user.avatar_url, role: user.role });
    acc[row.task_id] = list;
    return acc;
  }, {} as Record<string, { id: string; name: string; avatar_url?: string | null; role?: string | null }[]>);

  const dependenciesMap = dependenciesData.reduce<Record<string, string[]>>((acc, row: any) => {
    const list = acc[row.task_id] ?? [];
    if (row.depends_on_task_id) list.push(String(row.depends_on_task_id));
    acc[row.task_id] = list;
    return acc;
  }, {} as Record<string, string[]>);

  const commentsMap = commentsData.reduce<Record<string, number>>((acc, row: any) => {
    acc[row.task_id] = (acc[row.task_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (rows ?? []).map((task: any) => {
    const assignees =
      task.task_assignees?.map((ta: any) => ta.users).filter(Boolean).map((u: any) => ({
        id: u.id,
        name: u.full_name,
        avatar_url: u.avatar_url,
        role: u.role
      })) ?? assigneeMap[task.id] ?? [];

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
      due_date: task.due_date,
      assignees,
      assigneeIds: assignees.map((a: { id: string }) => a.id),
      depends_on:
        task.task_dependencies?.map((d: { depends_on_task_id: string | number }) => String(d.depends_on_task_id)) ??
        dependenciesMap[task.id] ??
        [],
      comments_count:
        task.task_comments?.length ??
        commentsMap[task.id] ??
        0,
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
