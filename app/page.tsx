import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// date-fns available for future calendar enhancements
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from('users').select('full_name, role').eq('id', session.user.id).single(),
    supabase.from('projects').select('*')
  ]);

  const { data: assigned } = await supabase
    .from('task_assignees')
    .select('task_id, tasks(id, title, status, due_date, sprint_id, project_id, progress_current, progress_target)')
    .eq('user_id', session.user.id);

  const todayIso = new Date().toISOString();
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, status, project_id')
    .lt('due_date', todayIso)
    .neq('status', 'done');

  const { data: currentSprint } = await supabase
    .from('sprints')
    .select('*')
    .lte('start_date', todayIso)
    .gte('end_date', todayIso)
    .limit(1)
    .maybeSingle();

  const projectIds = projects?.map((p) => p.id) ?? [];
  const { data: projectTasks } = projectIds.length
    ? await supabase
        .from('tasks')
        .select('id, status, project_id, progress_current, progress_target, sprint_id, due_date')
        .in('project_id', projectIds)
    : { data: [] };

  const progressByProject = (projectTasks ?? []).reduce<Record<string, { total: number; done: number }>>((acc, task) => {
    const existing = acc[task.project_id] ?? { total: 0, done: 0 };
    return {
      ...acc,
      [task.project_id]: {
        total: existing.total + 1,
        done: existing.done + (task.status === 'done' ? 1 : 0)
      }
    };
  }, {});

  const stats = {
    assigned: assigned?.length ?? 0,
    overdue: overdueTasks?.length ?? 0,
    currentSprint: currentSprint?.name ?? 'No active sprint'
  };

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs text-muted">Welcome back</div>
          <div className="text-2xl font-semibold">{profile?.full_name ?? 'Teammate'}</div>
          <div className="text-sm text-muted">Stay on top of your workspace</div>
        </div>
        {profile?.role !== 'worker' && (
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 shadow-sm">
          <div className="text-sm text-muted">Tasks assigned to me</div>
          <div className="text-2xl font-semibold">{stats.assigned}</div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="text-sm text-muted">Overdue</div>
          <div className="text-2xl font-semibold text-amber-600">{stats.overdue}</div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="text-sm text-muted">Current sprint</div>
          <div className="text-lg font-semibold">{stats.currentSprint}</div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="heading">Projects</div>
          <div className="text-sm text-muted">Visible to your role</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(projects ?? []).map((project) => {
            const progress = progressByProject[project.id] ?? { total: 0, done: 0 };
            const pct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
            const sprintLabel = currentSprint ? currentSprint.name : 'No sprint';
            return (
              <Card key={project.id} className="flex flex-col gap-3 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-base">{project.name}</div>
                    <div className="text-sm text-muted">{project.description}</div>
                  </div>
                  <Badge label={sprintLabel} />
                </div>
                <div className="text-xs text-muted">Progress</div>
                <Progress value={pct} />
                <div className="text-xs text-muted">{pct}% · {progress.done} / {progress.total || 1} done</div>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/projects/${project.id}?view=timeline`}>Timeline</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/projects/${project.id}`}>Open workspace</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
          {(projects ?? []).length === 0 && <Card className="p-4 text-sm text-muted">No projects yet.</Card>}
        </div>
      </div>
    </div>
  );
}
