'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { TaskModal } from './TaskModal';
import type { WorkspaceTask } from '../../lib/workspaceTypes';

const statusTone: Record<WorkspaceTask['status'], string> = {
  backlog: 'bg-slate-200 text-slate-700',
  todo: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  blocked: 'bg-rose-100 text-rose-700',
  done: 'bg-emerald-100 text-emerald-700'
};

function dateOrFallback(task: WorkspaceTask) {
  const start = task.start_date ? new Date(task.start_date) : task.due_date ? new Date(task.due_date) : null;
  const end = task.due_date ? new Date(task.due_date) : start;
  return { start, end: end ?? start };
}

export function ProjectTimeline({
  tasks,
  users,
  role,
  currentUserId,
  workspaceId,
  projectId
}: {
  tasks: WorkspaceTask[];
  users: { id: string; full_name: string; role: string; avatar_url?: string | null }[];
  role: string;
  currentUserId: string;
  workspaceId: number;
  projectId: number;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [items, setItems] = useState<WorkspaceTask[]>(tasks);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const filtered = useMemo(() => {
    return items.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && !(task.assigneeIds ?? []).includes(assigneeFilter)) return false;
      return true;
    });
  }, [assigneeFilter, items, statusFilter]);

  const dated = useMemo(() => filtered.map((task) => ({ task, ...dateOrFallback(task) })), [filtered]);
  const datedOnly = dated.filter((t) => t.start && t.end);
  const undated = dated.filter((t) => !t.start || !t.end);

  const minDate = datedOnly.length
    ? datedOnly.reduce((min, t) => (t.start && min && t.start < min ? t.start : min), datedOnly[0].start)
    : null;
  const maxDate = datedOnly.length
    ? datedOnly.reduce((max, t) => (t.end && max && t.end > max ? t.end : max), datedOnly[0].end)
    : null;

  const totalDays = minDate && maxDate ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))) : 1;

  const handleSaved = (task: WorkspaceTask) => {
    setItems((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)) : [...prev, task];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="all">All status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </Select>
          <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="w-48">
            <option value="all">All assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </Select>
        </div>
        {role !== 'worker' && (
          <Button onClick={() => setSelectedTaskId('new')} className="shadow-sm">
            Create task
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {datedOnly.map(({ task, start, end }) => {
          const target = task.progress_target ?? 1;
          const offset = start && minDate ? ((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * (100 / totalDays) : 0;
          const width = start && end && minDate ? (Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) * (100 / totalDays)) : 6;
          return (
            <Card
              key={task.id}
              className="flex flex-col gap-2 p-3 cursor-pointer"
              onClick={() => setSelectedTaskId(task.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-sm">{task.title}</div>
                  <div className="text-xs text-muted">{task.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}</div>
                  <div className="text-xs text-muted">
                    {start ? format(start, 'MMM d, yyyy') : 'n/a'} → {end ? format(end, 'MMM d, yyyy') : 'n/a'}
                  </div>
                  {task.depends_on && task.depends_on.length > 0 && (
                    <div className="text-[11px] text-muted">Depends on: {task.depends_on.length}</div>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-md text-[11px] font-medium ${statusTone[task.status]}`}>{task.status}</div>
              </div>
              <div className="relative h-6 w-full rounded-md bg-slate-100">
                <div
                  className="absolute top-0 h-6 rounded-md border border-slate-200"
                  style={{ left: `${offset}%`, width: `${Math.min(100, width)}%`, background: 'linear-gradient(90deg, #e0e7ff, #cbd5e1)' }}
                  title={`${task.title} (${task.status})`}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Progress {task.progress_current}/{Math.max(target, 1)}
                </span>
                <div className="w-32">
                  <Progress value={(task.progress_current / Math.max(target, 1)) * 100} />
                </div>
              </div>
            </Card>
          );
        })}
        {undated.length > 0 && (
          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Undated</div>
            {undated.map(({ task }) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded border border-border bg-panel px-2 py-1 text-sm cursor-pointer"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <span>{task.title}</span>
                <Badge label={task.status} />
              </div>
            ))}
          </Card>
        )}
        {datedOnly.length === 0 && undated.length === 0 && (
          <Card className="p-4 text-sm text-muted">No tasks match the current filters.</Card>
        )}
      </div>

      {selectedTaskId && (
        <TaskModal
          open={!!selectedTaskId}
          mode={selectedTaskId === 'new' ? 'create' : 'edit'}
          workspaceId={workspaceId}
          projectId={projectId}
          subprojectId={workspaceId !== projectId ? workspaceId : null}
          users={users}
          role={role}
          currentUserId={currentUserId}
          initialTask={selectedTaskId === 'new' ? undefined : items.find((t) => t.id === selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
          onSaved={(task) => {
            handleSaved(task as WorkspaceTask);
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}
