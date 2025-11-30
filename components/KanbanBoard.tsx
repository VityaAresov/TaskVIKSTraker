'use client';

import { useState } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Button } from './ui/Button';

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done';
  progress_current: number;
  progress_target: number;
  assignees?: { id: string; name: string }[];
};

const columns: { key: Task['status']; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' }
];

export function KanbanBoard({ tasks, onStatusChange }: { tasks: Task[]; onStatusChange?: (id: string, status: Task['status']) => void }) {
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
                className="cursor-move"
                draggable
                onDragStart={() => setDragging(task)}
                onDragEnd={() => setDragging(null)}
              >
                <div className="font-medium text-sm">{task.title}</div>
                <div className="text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap">{task.description}</div>
                <div className="mt-2">
                  <Progress value={(task.progress_current / Math.max(task.progress_target, 1)) * 100} />
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
