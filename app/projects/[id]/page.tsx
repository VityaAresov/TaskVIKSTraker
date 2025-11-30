import { notFound } from 'next/navigation';
import { Tabs } from '../../../components/ui/Tabs';
import { KanbanBoard, type Task } from '../../../components/KanbanBoard';
import { Timeline } from '../../../components/Timeline';
import { CalendarView } from '../../../components/CalendarView';
import { ResourceTable } from '../../../components/ResourceTable';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';

const mockTasks: Task[] = [
  { id: 't1', title: 'Plan outreach', description: 'Define ICP and messaging', status: 'in_progress', progress_current: 45, progress_target: 100, due_date: new Date().toISOString(), start_date: new Date().toISOString() },
  { id: 't2', title: 'Send first batch', description: '500 emails', status: 'blocked', progress_current: 90, progress_target: 200, due_date: new Date().toISOString(), start_date: new Date().toISOString(), depends_on: ['t1'] },
  { id: 't3', title: 'Refactor UI shell', description: 'Navigation and tabs', status: 'todo', progress_current: 0, progress_target: 100, due_date: null, start_date: null }
];

export default function ProjectPage({ params }: { params: { id: string } }) {
  if (!params.id) return notFound();

  return (
    <div className="container-page space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted">Project</div>
          <div className="text-2xl font-semibold">Workspace {params.id}</div>
        </div>
        <div className="flex gap-2 items-center">
          <Select defaultValue="all" className="w-40">
            <option value="all">All tasks</option>
            <option value="sprint1">Sprint 1</option>
          </Select>
          <Button>Create task</Button>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            id: 'board',
            label: 'Board',
            content: <KanbanBoard tasks={mockTasks} />
          },
          {
            id: 'timeline',
            label: 'Timeline',
            content: <Timeline tasks={mockTasks.map((t) => ({ id: t.id, title: t.title, start_date: t.start_date, due_date: t.due_date, status: t.status, depends_on: t.depends_on }))} />
          },
          {
            id: 'calendar',
            label: 'Calendar',
            content: <CalendarView tasks={mockTasks.map((t) => ({ id: t.id, title: t.title, due_date: t.due_date, status: t.status }))} />
          },
          {
            id: 'resources',
            label: 'Resources',
            content: (
              <ResourceTable
                rows={[
                  { user: { id: 'u1', name: 'Alex Manager', role: 'manager' }, counts: { backlog: 2, todo: 1, in_progress: 2, blocked: 1, done: 3 } },
                  { user: { id: 'u2', name: 'Mila Worker', role: 'worker' }, counts: { backlog: 1, todo: 2, in_progress: 1, blocked: 0, done: 1 } }
                ]}
              />
            )
          }
        ]}
      />
    </div>
  );
}
