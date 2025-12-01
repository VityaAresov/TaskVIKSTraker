'use client';

import { useState } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Avatar } from './ui/Avatar';
import type { WorkspaceTask } from '../lib/workspaceTypes';

export type Task = WorkspaceTask;

export function KanbanBoard({
  tasks,
  onStatusChange,
  onSelect,
  columnLabels,
  canEditColumns,
  onEditColumn,
  editingKey,
  labelDraft,
  onLabelDraftChange,
  onSaveLabel
}: {
  tasks: Task[];
  onStatusChange?: (id: string, status: Task['status']) => void;
  onSelect?: (id: string) => void;
  columnLabels?: { backlog: string; todo: string; in_progress: string; blocked: string; done: string };
  canEditColumns?: boolean;
  onEditColumn?: (key: Task['status']) => void;
  editingKey?: Task['status'];
  labelDraft?: string;
  onLabelDraftChange?: (value: string) => void;
  onSaveLabel?: () => void;
}) {
  const [dragging, setDragging] = useState<Task | null>(null);

  const byColumn = (status: Task['status']) => tasks.filter((task) => task.status === status);

  const columns: { key: Task['status']; label: string }[] = [
    { key: 'backlog', label: columnLabels?.backlog ?? 'Backlog' },
    { key: 'todo', label: columnLabels?.todo ?? 'To Do' },
    { key: 'in_progress', label: columnLabels?.in_progress ?? 'In Progress' },
    { key: 'blocked', label: columnLabels?.blocked ?? 'Blocked' },
    { key: 'done', label: columnLabels?.done ?? 'Done' }
  ];

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
            <div className="flex items-center gap-2 font-semibold text-sm">
              {editingKey === column.key ? (
                <input
                  className="rounded border border-border px-2 py-1 text-xs"
                  value={labelDraft ?? ''}
                  onChange={(e) => onLabelDraftChange?.(e.target.value)}
                  onBlur={onSaveLabel}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveLabel?.();
                    if (e.key === 'Escape') onLabelDraftChange?.(column.label);
                  }}
                  autoFocus
                />
              ) : (
                <span>{column.label}</span>
              )}
              {canEditColumns && !editingKey && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-foreground"
                  onClick={() => onEditColumn?.(column.key)}
                  aria-label={`Rename ${column.label}`}
                >
                  ✎
                </button>
              )}
            </div>
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
                  {task.has_children && <Badge label="Subtasks" />}
                  {task.depends_on && task.depends_on.length > 0 && <Badge label={`Depends ${task.depends_on.length}`} />}
                  {typeof task.comments_count === 'number' && <Badge label={`${task.comments_count} comments`} />}
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
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
