'use client';

import { useState } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done';
  progress_current: number;
  progress_target: number;
  assignees?: { id: string; name: string; avatar_url?: string | null }[];
  start_date?: string | null;
  due_date?: string | null;
  depends_on?: string[];
  comments_count?: number;
  has_children?: boolean;
};

const columns: { key: Task['status']; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' }
];

export function KanbanBoard({
  tasks,
  onStatusChange,
  onSelect
}: {
  tasks: Task[];
  onStatusChange?: (id: string, status: Task['status']) => void;
  onSelect?: (id: string) => void;
}) {
  const [dragging, setDragging] = useState<Task | null>(null);

  const byColumn = (status: Task['status']) => tasks.filter((task) => task.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {columns.map((column) => (
        <div
          key={column.key}
          className="rounded-lg border border-border bg-panel p-2 min-h-[200px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragging && onStatusChange) {
              onStatusChange(dragging.id, column.key);
            }
            setDragging(null);
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">{column.label}</div>
            <Badge label={`${byColumn(column.key).length}`} />
          </div>
          <div className="flex flex-col gap-2">
            {byColumn(column.key).map((task) => (
              <Card
                key={task.id}
                className="cursor-move hover:shadow-sm transition"
                draggable
                onDragStart={() => setDragging(task)}
                onDragEnd={() => setDragging(null)}
                onClick={() => onSelect?.(task.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap">
                      {task.description}
                    </div>
                  </div>
                  {task.due_date && (
                    <Badge
                      label={new Date(task.due_date).toLocaleDateString()}
                      tone={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'critical' : 'muted'}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted mt-2">
                  {task.has_children && <span>Subtasks</span>}
                  {task.depends_on && task.depends_on.length > 0 && <span>Depends on {task.depends_on.length}</span>}
                  {typeof task.comments_count === 'number' && <span>{task.comments_count} comments</span>}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex -space-x-2">
                    {(task.assignees ?? []).slice(0, 3).map((person) => (
                      <Avatar key={person.id} fallback={person.name[0]} src={person.avatar_url} size="sm" />
                    ))}
                    {(task.assignees ?? []).length > 3 && (
                      <div className="w-7 h-7 rounded-full border border-border bg-white text-xs flex items-center justify-center text-muted">
                        +{(task.assignees ?? []).length - 3}
                      </div>
                    )}
                  </div>
                  <div className="min-w-[80px]">
                    <Progress value={(task.progress_current / Math.max(task.progress_target, 1)) * 100} />
                  </div>
                </div>
                {onStatusChange && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {columns.map((c) => (
                      <Button key={c.key} className="text-xs px-2 py-1" onClick={() => onStatusChange(task.id, c.key)}>
                        {c.label}
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
