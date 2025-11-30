import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { format } from 'date-fns';

export type TimelineTask = {
  id: string;
  title: string;
  start_date?: string | null;
  due_date?: string | null;
  status: string;
  depends_on?: string[];
};

export function Timeline({ tasks }: { tasks: TimelineTask[] }) {
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <Card key={task.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">{task.title}</div>
            <div className="text-xs text-muted">
              {task.start_date ? format(new Date(task.start_date), 'MMM d') : 'n/a'} →{' '}
              {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'n/a'}
            </div>
            {task.depends_on && task.depends_on.length > 0 && (
              <div className="text-xs text-muted mt-1">Depends on: {task.depends_on.join(', ')}</div>
            )}
          </div>
          <Badge label={task.status} tone={task.status === 'blocked' ? 'critical' : 'muted'} />
        </Card>
      ))}
    </div>
  );
}
