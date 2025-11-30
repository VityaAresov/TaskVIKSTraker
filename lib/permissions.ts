import { type AppRole } from './auth';

const precedence: Record<AppRole, number> = { worker: 0, manager: 1, owner: 2 };

export function canManageProjects(role: AppRole) {
  return precedence[role] >= precedence['manager'];
}

export function canManageUsers(role: AppRole) {
  return precedence[role] >= precedence['owner'];
}

export function canViewTask(role: AppRole, task: { visible_to_role: string; visible_to_user_ids: string[] | null; assigneeIds?: string[]; currentUserId?: string }) {
  if (role === 'owner') return true;
  if (task.visible_to_user_ids && task.currentUserId && task.visible_to_user_ids.includes(task.currentUserId)) return true;
  if (task.assigneeIds && task.currentUserId && task.assigneeIds.includes(task.currentUserId)) return true;
  if (task.visible_to_role === 'all') return true;
  if (task.visible_to_role === 'workers_and_above') return precedence[role] >= precedence['worker'];
  if (task.visible_to_role === 'managers_and_above') return precedence[role] >= precedence['manager'];
  return false;
}
