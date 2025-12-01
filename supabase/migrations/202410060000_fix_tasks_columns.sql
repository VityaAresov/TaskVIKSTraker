-- Task schema aligns to the production Supabase structure; no extra workspace columns required.
-- Keep progress_target in sync with defaults if it was missing previously.
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS progress_target integer DEFAULT 100;
