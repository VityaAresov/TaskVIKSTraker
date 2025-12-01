-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users table mirrors Supabase auth with profile data
create type role as enum ('worker', 'manager', 'owner');
create type task_status as enum ('backlog', 'todo', 'in_progress', 'blocked', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'critical');
create type visible_role as enum ('all', 'workers_and_above', 'managers_and_above', 'owners_only');
create type notification_type as enum ('task_assigned', 'task_completed', 'task_overdue', 'comment_added', 'email_sent');

create table if not exists users (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role role not null default 'worker',
  created_at timestamp with time zone default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references users(id),
  parent_project_id uuid references projects(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  created_by uuid references users(id),
  created_at timestamp with time zone default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  sprint_id uuid references sprints(id),
  parent_task_id uuid references tasks(id),
  title text not null,
  description text,
  status task_status not null default 'backlog',
  progress_current integer default 0,
  progress_target integer default 100,
  priority task_priority not null default 'medium',
  visible_to_role visible_role not null default 'all',
  visible_to_user_ids uuid[],
  due_date date,
  created_by uuid references users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists task_dependencies (
  task_id uuid references tasks(id) on delete cascade,
  depends_on_task_id uuid references tasks(id) on delete cascade
);

create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  author_id uuid references users(id),
  body text,
  created_at timestamp with time zone default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type notification_type not null,
  payload jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists ai_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references users(id),
  role role not null,
  query text,
  response jsonb,
  created_at timestamp with time zone default now()
);

alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_comments enable row level security;
alter table notifications enable row level security;
alter table projects enable row level security;
alter table sprints enable row level security;
alter table users enable row level security;

-- Policies
create policy "Users can view themselves" on users for select using (auth.uid() = id);
create policy "Insert profile on signup" on users for insert with check (auth.uid() = id);
create policy "Owners can update roles" on users for update using (exists(select 1 from users u where u.id = auth.uid() and u.role = 'owner'));

create policy "Projects visible to all roles" on projects for select using (true);
create policy "Managers create projects" on projects for insert with check (exists(select 1 from users u where u.id = auth.uid() and u.role in ('manager','owner')));

create policy "Select sprints" on sprints for select using (true);
create policy "Managers insert sprints" on sprints for insert with check (exists(select 1 from users u where u.id = auth.uid() and u.role in ('manager','owner')));

create policy "Select tasks with visibility" on tasks for select using (
  case
    when (select role from users where id = auth.uid()) = 'owner' then true
    when visible_to_user_ids is not null then auth.uid() = any(visible_to_user_ids)
    when visible_to_role = 'all' then true
    when visible_to_role = 'workers_and_above' then (select role from users where id = auth.uid()) in ('worker','manager','owner')
    when visible_to_role = 'managers_and_above' then (select role from users where id = auth.uid()) in ('manager','owner')
    else false
  end
);
create policy "Managers insert tasks" on tasks for insert with check ((select role from users where id = auth.uid()) in ('manager','owner'));
create policy "Managers update tasks" on tasks for update using ((select role from users where id = auth.uid()) in ('manager','owner'));
create policy "Assignees update progress" on tasks for update using (exists(select 1 from task_assignees ta where ta.task_id = id and ta.user_id = auth.uid()));
create policy "Managers delete tasks" on tasks for delete using ((select role from users where id = auth.uid()) in ('manager','owner'));
create policy "Assignee can view" on task_assignees for select using (auth.uid() = user_id);
create policy "Comments visible" on task_comments for select using (auth.uid() = author_id or auth.uid() in (select user_id from task_assignees where task_id = task_comments.task_id));
create policy "Notifications per user" on notifications for select using (auth.uid() = user_id);

-- Column labels for Kanban customization
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS column_backlog_label text DEFAULT 'Backlog';
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS column_todo_label text DEFAULT 'To Do';
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS column_in_progress_label text DEFAULT 'In Progress';
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS column_blocked_label text DEFAULT 'Blocked';
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS column_done_label text DEFAULT 'Done';
