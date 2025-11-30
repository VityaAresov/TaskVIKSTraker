# TaskVIKS Tracker

A minimalistic yet powerful task-tracking workspace inspired by ClickUp + Kaiten. Built with Next.js 14, Tailwind CSS, and Supabase (PostgreSQL + Auth + RLS).

## Features
- Email magic links (primary) plus Google OAuth (Supabase Auth) with role-based access: worker, manager, owner (owners manage roles and AI settings).
- Projects, sprints, tasks with visibility controls, subtasks, dependencies, comments, notifications.
- Board, timeline, calendar, and resource allocation views.
- Progress tracking with current/target values and aggregate subtasks (UI placeholder, backend fields ready).
- Email reminder abstraction and AI-ready endpoints (`/api/ai/query`) with context + mutation guards.

## Getting started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Copy `.env.example` to `.env.local`. It is prefilled with the provided Supabase project keys:

- `NEXT_PUBLIC_SUPABASE_URL` – https://jjainebdqrdqvxjnoejz.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYWluZWJkcXJkcXZ4am5vZWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTAyODMsImV4cCI6MjA4MDA2NjI4M30.KykQsE2s2Cyg5Cr12L6f532C3VT0SEzTDQKq3BBYGFM
- `SUPABASE_SERVICE_ROLE_KEY` – leave empty or set privately in Vercel if you use server actions.

Both the `NEXT_PUBLIC_*` names and server-only `SUPABASE_URL`/`SUPABASE_ANON_KEY` keys are accepted (they resolve to the same values at runtime).
- `NEXT_PUBLIC_SITE_URL` – base site URL used for OAuth redirects and email magic link callbacks

### 3) Provision database
Run the SQL schema in `supabase/schema.sql` on your Supabase project. You can use the Supabase SQL editor or CLI:
```bash
supabase db push --file supabase/schema.sql
```
The schema defines tables, enums, and Row Level Security policies for tasks, assignments, visibility, and notifications.

### 4) Start the dev server
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Project structure
- `app/` – Next.js App Router pages and API route handlers.
- `components/` – UI primitives and workspace views (board, timeline, calendar, resources, task details).
- `lib/` – Supabase clients, auth helpers, permissions, AI context/controller, and email abstraction.
- `supabase/schema.sql` – database schema with RLS policies.

## Auth flow
- Email magic link is the primary sign-in (Google OAuth is available as a secondary option).
- On first login, create a row in `users` with default `worker` role. (Handled via Supabase trigger/edge function outside of this repo.)
- Middleware (`middleware.ts`) redirects unauthenticated visitors to `/login`.

## API overview
- `GET /api/me` – current user profile.
- `GET/POST /api/projects` – list/create projects (managers/owners only for POST).
- `GET/POST /api/sprints` – list/create sprints.
- `GET/POST /api/tasks` – list/create tasks with visibility fields.
- `PATCH/DELETE /api/tasks/:id` – update progress/status/visibility or delete (manager/owner).
- `POST /api/ai/query` – placeholder AI endpoint returning context preview and optional mutations with role checks.

## Emails
`lib/email.ts` exposes `sendTaskReminderEmail` with a TODO to wire a real provider (Resend/SendGrid). Server actions or API routes can call it to send reminder emails to assignees.

## Notes
- UI uses Tailwind for a clean, Figma-like light theme with progressive disclosure via tabs and cards.
- Data displayed in pages is mocked for now; hook up to Supabase queries for production use.

## Deployment
- Vercel is expected to detect this as a Next.js app; `vercel.json` pins the framework and output to `.next` to avoid the “No Output Directory named \"public\" found” error.
- An empty `public/` directory (tracked via `.gitkeep`) is included so Vercel’s static-output heuristics do not fail if project settings were previously misconfigured.
