import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../lib/supabaseServer';
import { getCurrentUser } from '../../../../../lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, users(full_name)')
    .eq('task_id', params.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: params.id, author_id: user.id, body: body.body })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: assignees } = await supabase.from('task_assignees').select('user_id').eq('task_id', params.id);
  const targets = [
    ...(assignees?.map((a) => a.user_id) ?? []),
    user.id
  ];
  await Promise.all(
    targets.map((targetId) =>
      supabase.from('notifications').insert({
        user_id: targetId,
        type: 'comment_added',
        payload: { message: `New comment on task ${params.id}`, comment_id: data.id },
        is_read: false
      })
    )
  );

  return NextResponse.json({ comment: data });
}
