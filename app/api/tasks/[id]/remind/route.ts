import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../lib/supabaseServer';
import { getCurrentUser } from '../../../../../lib/auth';
import { canManageProjects } from '../../../../../lib/permissions';
import { sendTaskReminderEmail } from '../../../../../lib/email';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!canManageProjects(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, project_id')
    .eq('id', params.id)
    .single();

  const { data: assignees } = await supabase
    .from('task_assignees')
    .select('users:users(email, full_name, id)')
    .eq('task_id', params.id);

  const emails = (assignees ?? [])
    .map((a: any) => (Array.isArray(a.users) ? a.users[0]?.email : a.users?.email))
    .filter(Boolean);

  await sendTaskReminderEmail({
    to: emails,
    subject: `[TaskVIKS] Reminder: ${task?.title}`,
    body: `Please review your task: ${task?.title}`
  });

  await Promise.all(
    (assignees ?? []).map((a) =>
      supabase.from('notifications').insert({
        user_id: (a as any).users?.id ?? user.id,
        type: 'email_sent',
        payload: { message: `Reminder sent for task ${task?.title}` },
        is_read: false
      })
    )
  );

  return NextResponse.json({ ok: true });
}
