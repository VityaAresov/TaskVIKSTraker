import { createServiceRoleClient, createSupabaseServerClient } from './supabaseClient';
import { type AppUser } from './auth';

export async function getAIContext(user: AppUser) {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceRoleClient()
    : createSupabaseServerClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, owner_id')
    .limit(50);
  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, project_id, name, start_date, end_date, description')
    .limit(100);
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, project_id, sprint_id, title, status, progress_current, progress_target, priority, visible_to_role, visible_to_user_ids, due_date, parent_task_id')
    .limit(200);

  return {
    user: { id: user.id, role: user.role },
    projects: projects ?? [],
    sprints: sprints ?? [],
    tasks: tasks ?? []
  };
}
