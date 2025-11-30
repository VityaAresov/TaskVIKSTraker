import { createServiceRoleClient } from './supabaseClient';
import { createSupabaseServerClient } from './supabaseServer';
import { type AppUser } from './auth';

export type AIMutation =
  | { type: 'create_task'; payload: { project_id: string; title: string; description?: string } }
  | { type: 'update_status'; payload: { task_id: string; status: string } }
  | { type: 'update_progress'; payload: { task_id: string; progress_current: number } };

export async function applyAIMutations(user: AppUser, actions: AIMutation[]) {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceRoleClient()
    : createSupabaseServerClient();
  const allowed = user.role === 'manager' || user.role === 'owner';
  if (!allowed) {
    return { applied: [], rejected: actions.map((action) => ({ action, reason: 'read-only role' })) };
  }

  const applied: AIMutation[] = [];
  const rejected: { action: AIMutation; reason: string }[] = [];

  for (const action of actions) {
    if (action.type === 'create_task') {
      const { error } = await supabase.from('tasks').insert({
        project_id: action.payload.project_id,
        title: action.payload.title,
        description: action.payload.description ?? '',
        status: 'todo'
      });
      if (!error) applied.push(action);
      else rejected.push({ action, reason: error.message });
    }
    if (action.type === 'update_status') {
      const { error } = await supabase
        .from('tasks')
        .update({ status: action.payload.status })
        .eq('id', action.payload.task_id);
      if (!error) applied.push(action);
      else rejected.push({ action, reason: error.message });
    }
    if (action.type === 'update_progress') {
      const { error } = await supabase
        .from('tasks')
        .update({ progress_current: action.payload.progress_current })
        .eq('id', action.payload.task_id);
      if (!error) applied.push(action);
      else rejected.push({ action, reason: error.message });
    }
  }

  return { applied, rejected };
}
