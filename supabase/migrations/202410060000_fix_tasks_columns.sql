-- Ensure workspace-aware columns exist in tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS subproject_id bigint references public.projects(id) on delete cascade;

-- Align date tracking columns
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS due_date date;

-- Align progress target naming
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS progress_target integer DEFAULT 100;
