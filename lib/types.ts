import { AppRole } from './auth';

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: AppRole;
};

export type Project = {
  id: number;
  name: string;
  description?: string;
  owner_id: string;
  parent_project_id: number | null;
  created_at?: string;
};

export type Sprint = {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string;
};

export type Task = {
  id: string;
  project_id: number;
  subproject_id?: number | null;
  sprint_id: number | null;
  parent_task_id: string | null;
  title: string;
  description?: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done';
  progress_current: number;
  progress_target: number;
  progress_total?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  visible_to_role: 'all' | 'workers_and_above' | 'managers_and_above' | 'owners_only';
  visible_to_user_ids: string[] | null;
  due_date?: string | null;
  start_date?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type AISession = {
  id: string;
  created_by: string;
  role: AppRole;
  query: string;
  response: string;
  created_at: string;
};
