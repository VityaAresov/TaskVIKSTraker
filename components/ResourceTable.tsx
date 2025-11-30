import { Card } from './ui/Card';
import { Progress } from './ui/Progress';

export type ResourceRow = {
  user: { id: string; name: string; role: string };
  counts: { backlog: number; todo: number; in_progress: number; blocked: number; done: number };
};

export function ResourceTable({ rows }: { rows: ResourceRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => {
        const total = Object.values(row.counts).reduce((sum, v) => sum + v, 0);
        const progressValue = total === 0 ? 0 : (row.counts.done / total) * 100;
        return (
          <Card key={row.user.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">{row.user.name}</div>
              <div className="text-xs text-muted">{row.user.role}</div>
            </div>
            <Progress value={progressValue} />
            <div className="text-xs text-muted">
              Backlog {row.counts.backlog} · Todo {row.counts.todo} · In progress {row.counts.in_progress} · Blocked {row.counts.blocked} · Done {row.counts.done}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
