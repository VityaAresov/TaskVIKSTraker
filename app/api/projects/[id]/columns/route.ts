import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/auth';
import { createSupabaseServerClient } from '../../../../../lib/supabaseServer';
import { canManageProjects } from '../../../../../lib/permissions';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const payload = await request.json();
  const supabase = createSupabaseServerClient();
  const key = typeof payload.key === 'string' ? payload.key : '';
  const label = typeof payload.label === 'string' ? payload.label.trim() : '';
  const allowedKeys = ['backlog', 'todo', 'in_progress', 'blocked', 'done'];

  if (!allowedKeys.includes(key) || !label) {
    return NextResponse.json({ error: 'Invalid column update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('project_columns')
    .upsert({ project_id: Number(params.id), key, label }, { onConflict: 'project_id,key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ key, label });
}
