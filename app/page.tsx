import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const dynamic = 'force-dynamic';

const mockProjects = [
  { id: 'p1', name: 'Growth Campaign', description: 'Outbound and email automation', sprint: 'Sprint 5', assigned: 12, overdue: 3 },
  { id: 'p2', name: 'Platform Revamp', description: 'Refine architecture for AI flows', sprint: 'Sprint 2', assigned: 8, overdue: 1 }
];

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', session.user.id)
    .single();

  return (
    <div className="container-page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Welcome back</div>
          <div className="text-2xl font-semibold">{profile?.full_name ?? 'Teammate'}</div>
        </div>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <div className="text-sm text-muted">Tasks assigned to me</div>
          <div className="text-2xl font-semibold">14</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Overdue</div>
          <div className="text-2xl font-semibold">4</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Current sprint</div>
          <div className="text-2xl font-semibold">Sprint 5</div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="heading">Projects</div>
          <div className="text-sm text-muted">Visible to your role</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockProjects.map((project) => (
            <Card key={project.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{project.name}</div>
                <Badge label={project.sprint} />
              </div>
              <div className="text-sm text-muted">{project.description}</div>
              <div className="text-xs text-muted">Assigned: {project.assigned} · Overdue: {project.overdue}</div>
              <Button asChild>
                <Link href={`/projects/${project.id}`}>Open workspace</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
