import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import { getCurrentUser } from '../../../lib/auth';
import { canManageProjects } from '../../../lib/permissions';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const supabase = createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const projectIdParam = searchParams.get('project_id');
  const sprintIdParam = searchParams.get('sprint_id');
  const subprojectIdParam = searchParams.get('subproject_id');
  const projectId = projectIdParam ? Number(projectIdParam) : null;
  const sprintId = sprintIdParam ? Number(sprintIdParam) : null;
  const subprojectId = subprojectIdParam ? Number(subprojectIdParam) : null;
  const baseSelect = 'id, project_id, sprint_id, parent_task_id, title, description, status, start_date, due_date, progress_current, progress_target, priority, visible_to_role, visible_to_user_ids, created_by, created_at, updated_at, task_assignees(user_id), task_dependencies(depends_on_task_id)';

  const runQuery = (includeSub: boolean) => {
    let select = baseSelect;
    let query = supabase.from('tasks').select(select);
    if (projectId !== null && !Number.isNaN(projectId)) query = query.eq('project_id', projectId);
    if (includeSub && subprojectIdParam !== null) {
      select = `${baseSelect}, subproject_id`;
      query = supabase.from('tasks').select(select);
      if (projectId !== null && !Number.isNaN(projectId)) query = query.eq('project_id', projectId);
      if (subprojectId !== null && !Number.isNaN(subprojectId)) {
        query = query.eq('subproject_id', subprojectId);
      } else {
        query = query.is('subproject_id', null);
      }
    }
    if (sprintId !== null && !Number.isNaN(sprintId)) query = query.eq('sprint_id', sprintId);
    return query;
  };

  let { data, error } = await runQuery(true);

  if (error && error.message.includes('subproject_id')) {
    console.warn('[tasks GET] subproject_id missing, retrying without subproject filter');
    ({ data, error } = await runQuery(false));
  }

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
  const subprojectId =
    payload.subproject_id === null || payload.subproject_id === undefined || Number.isNaN(Number(payload.subproject_id))
      ? null
      : Number(payload.subproject_id);
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
    due_date: payload.due_date,
    start_date: payload.start_date ?? null,
    created_by: user.id
  };

  if (subprojectId !== null) insertPayload.subproject_id = subprojectId;

  const attemptInsert = async (withSub: boolean) => {
    const payloadToUse = { ...insertPayload };
    if (!withSub) delete payloadToUse.subproject_id;
    return supabase.from('tasks').insert(payloadToUse).select().single();
  };

  let { data, error } = await attemptInsert(true);

  if (error && error.message.includes('subproject_id')) {
    console.warn('[tasks POST] subproject_id missing, retrying without subproject column');
    ({ data, error } = await attemptInsert(false));
  }

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
