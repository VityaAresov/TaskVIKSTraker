import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';
import { getCurrentUser } from '../../../../lib/auth';
import { canManageProjects } from '../../../../lib/permissions';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const payload = await request.json();
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from('tasks').select('*').eq('id', Number(params.id)).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: assignees } = await supabase.from('task_assignees').select('user_id').eq('task_id', Number(params.id));
  const isAssignee = (assignees ?? []).some(({ user_id }: { user_id: string }) => user_id === user.id);
  const canManage = canManageProjects(user.role);
  if (!canManage && !isAssignee && user.id !== existing.created_by) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: Record<string, any> = {};

  if (payload.status && (canManage || isAssignee)) updates.status = payload.status;
  if (payload.progress_current !== undefined && (canManage || isAssignee))
    updates.progress_current = payload.progress_current;
  if (payload.progress_target !== undefined && canManage) updates.progress_target = payload.progress_target;
  if (payload.progress_total !== undefined && (canManage || isAssignee)) updates.progress_total = payload.progress_total;
  if (canManage) {
    updates.visible_to_role = payload.visible_to_role ?? existing.visible_to_role;
    updates.visible_to_user_ids = payload.visible_to_user_ids ?? existing.visible_to_user_ids;
    updates.description = payload.description ?? existing.description;
    updates.title = payload.title ?? existing.title;
    updates.due_date = payload.due_date ?? existing.due_date;
    updates.start_date = payload.start_date ?? existing.start_date;
    updates.priority = payload.priority ?? existing.priority;
    updates.sprint_id = payload.sprint_id ?? existing.sprint_id;
    if (payload.subproject_id !== undefined) updates.subproject_id = payload.subproject_id;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase.from('tasks').update(updates).eq('id', Number(params.id)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (canManage && Array.isArray(payload.assignees)) {
    const desiredIds: string[] = payload.assignees;
    const existingIds = (assignees ?? []).map((a: any) => a.user_id);
    const toRemove = existingIds.filter((id) => !desiredIds.includes(id));
    const toAdd = desiredIds.filter((id) => !existingIds.includes(id));

    if (toRemove.length) {
      await supabase.from('task_assignees').delete().eq('task_id', Number(params.id)).in('user_id', toRemove);
    }
    if (toAdd.length) {
      await supabase
        .from('task_assignees')
        .insert(toAdd.map((user_id: string) => ({ task_id: Number(params.id), user_id })));
    }
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('tasks').delete().eq('id', Number(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
