import { format } from 'date-fns';
import { Card } from './ui/Card';

export type CalendarTask = { id: string; title: string; due_date?: string | null; status: string };

export function CalendarView({ tasks }: { tasks: CalendarTask[] }) {
  const byDate = tasks.reduce<Record<string, CalendarTask[]>>((acc, task) => {
    const key = task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : 'no-date';
    acc[key] = acc[key] ? [...acc[key], task] : [task];
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(byDate).map(([day, dayTasks]) => (
        <Card key={day} className="flex flex-col gap-2">
          <div className="font-semibold text-sm">{day === 'no-date' ? 'No due date' : format(new Date(day), 'MMM d, yyyy')}</div>
          {dayTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between text-sm">
              <span>{task.title}</span>
              <span className="text-xs text-muted">{task.status}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
