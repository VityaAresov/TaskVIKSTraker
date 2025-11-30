import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseClient';
import { getCurrentUser } from '../../../lib/auth';
import { canManageProjects } from '../../../lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('projects').select('*');
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const payload = await request.json();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({ name: payload.name, description: payload.description, owner_id: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ project: data });
}
