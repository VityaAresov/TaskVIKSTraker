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
  const updates: Record<string, string> = {};

  const allowedKeys = new Set([
    'column_backlog_label',
    'column_todo_label',
    'column_in_progress_label',
    'column_blocked_label',
    'column_done_label'
  ]);

  Object.entries(payload).forEach(([key, value]) => {
    if (allowedKeys.has(key) && typeof value === 'string' && value.trim()) {
      updates[key] = value.trim();
    }
  });

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data, error } = await supabase.from('projects').update(updates).eq('id', Number(params.id)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ project: data });
}
