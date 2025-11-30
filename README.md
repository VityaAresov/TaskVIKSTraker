# TaskVIKS Tracker

A minimalistic yet powerful task-tracking workspace inspired by ClickUp + Kaiten. Built with Next.js 14, Tailwind CSS, and Supabase (PostgreSQL + Auth + RLS).

## Features
- Google OAuth (Supabase Auth) with role-based access: worker, manager, owner (owners manage roles and AI settings).
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
Copy `.env.example` to `.env.local` and set your Supabase values.
- `NEXT_PUBLIC_SUPABASE_URL` – project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon key for client access
- `SUPABASE_SERVICE_ROLE_KEY` – service role for server actions (kept server-side only)
- `NEXT_PUBLIC_SITE_URL` – base site URL used for OAuth redirects

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
- Only Google OAuth is allowed.
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
