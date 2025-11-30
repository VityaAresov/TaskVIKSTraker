import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../../lib/supabaseClient';
import { getCurrentUser } from '../../../../lib/auth';
import { canManageProjects } from '../../../../lib/permissions';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const payload = await request.json();
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase.from('tasks').select('*').eq('id', params.id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canManageProjects(user.role) && user.id !== existing.created_by) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: payload.status ?? existing.status,
      progress_current: payload.progress_current ?? existing.progress_current,
      progress_target: payload.progress_target ?? existing.progress_target,
      visible_to_role: payload.visible_to_role ?? existing.visible_to_role,
      visible_to_user_ids: payload.visible_to_user_ids ?? existing.visible_to_user_ids
    })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('tasks').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
