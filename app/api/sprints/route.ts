import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../lib/supabaseClient';
import { getCurrentUser } from '../../../lib/auth';
import { canManageProjects } from '../../../lib/permissions';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const query = supabase.from('sprints').select('*');
  if (projectId) query.eq('project_id', projectId);
  const { data } = await query;
  return NextResponse.json({ sprints: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const payload = await request.json();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('sprints')
    .insert({ ...payload, created_by: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ sprint: data });
}
