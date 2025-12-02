import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import { getCurrentUser } from '../../../lib/auth';
import { canManageProjects } from '../../../lib/permissions';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const supabase = createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const projectIdParam = searchParams.get('projectId') ?? searchParams.get('project_id');
  const projectId = projectIdParam ? Number(projectIdParam) : NaN;

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const selectColumns =
    'id, project_id, sprint_id, parent_task_id, title, description, status, due_date, progress_current, progress_target, priority, visible_to_role, visible_to_user_ids, task_assignees(user_id, users(id, full_name, avatar_url, role)), task_dependencies(depends_on_task_id), task_comments(id)';

  const { data, error } = await supabase
    .from('tasks')
    .select(selectColumns)
    .eq('project_id', projectId)
    .order('id', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const payload = await request.json();
  const supabase = createSupabaseServerClient();
  const projectId = Number(payload.project_id);
  if (!payload.title || Number.isNaN(projectId)) {
    return NextResponse.json({ error: 'Project and title are required' }, { status: 400 });
  }
  const insertPayload: Record<string, any> = {
    project_id: projectId,
    sprint_id: payload.sprint_id ?? null,
    parent_task_id: payload.parent_task_id ?? null,
    title: payload.title,
    description: payload.description,
    status: payload.status ?? 'todo',
    progress_current: payload.progress_current ?? 0,
    progress_target: payload.progress_target ?? 100,
    priority: payload.priority ?? 'medium',
    visible_to_role: payload.visible_to_role ?? 'all',
    visible_to_user_ids: payload.visible_to_user_ids ?? null,
    due_date: payload.due_date
  };

  const { data, error } = await supabase.from('tasks').insert(insertPayload).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (payload.assignees?.length) {
    await supabase.from('task_assignees').insert(
      payload.assignees.map((assigneeId: string) => ({ task_id: data.id, user_id: assigneeId }))
    );
    await Promise.all(
      payload.assignees.map((assigneeId: string) =>
        supabase.from('notifications').insert({
          user_id: assigneeId,
          type: 'task_assigned',
          payload: { message: `You were assigned to ${payload.title}` },
          is_read: false
        })
      )
    );
  }

  return NextResponse.json({ task: data });
}
