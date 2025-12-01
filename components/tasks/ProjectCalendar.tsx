'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { TaskModal } from './TaskModal';
import type { WorkspaceTask } from '../../lib/workspaceTypes';

function groupByDueDate(tasks: WorkspaceTask[]) {
  return tasks.reduce<Record<string, WorkspaceTask[]>>((acc, task) => {
    const key = task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : 'no-date';
    acc[key] = acc[key] ? [...acc[key], task] : [task];
    return acc;
  }, {});
}

export function ProjectCalendar({
  tasks,
  users,
  role,
  currentUserId,
  workspaceId
}: {
  tasks: WorkspaceTask[];
  users: { id: string; full_name: string; role: string; avatar_url?: string | null }[];
  role: string;
  currentUserId: string;
  workspaceId: number;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [items, setItems] = useState<WorkspaceTask[]>(tasks);

  const filtered = useMemo(() => {
    return items.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && !(task.assigneeIds ?? []).includes(assigneeFilter)) return false;
      return true;
    });
  }, [assigneeFilter, items, statusFilter]);

  const grouped = useMemo(() => groupByDueDate(filtered), [filtered]);
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'no-date') return 1;
    if (b === 'no-date') return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const handleSaved = (task: WorkspaceTask) => {
    setItems((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)) : [...prev, task];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
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
          <button
            type="button"
            onClick={() => setSelectedTaskId('new')}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm"
          >
            Create task
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sortedKeys.map((day) => (
          <Card key={day} className="space-y-2">
            <div className="text-sm font-semibold">
              {day === 'no-date' ? 'No due date' : format(new Date(day), 'MMM d, yyyy')}
            </div>
            <div className="flex flex-col gap-2">
              {grouped[day].map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-1 rounded border border-border bg-panel px-3 py-2 cursor-pointer"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{task.title}</div>
                    <Badge label={task.status} />
                  </div>
                  <div className="text-xs text-muted">{task.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}</div>
                  <div className="w-full">
                    <Progress value={(task.progress_current / Math.max(task.progress_target, 1)) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {sortedKeys.length === 0 && <Card className="p-4 text-sm text-muted">No tasks match the current filters.</Card>}
      </div>

      {selectedTaskId && (
        <TaskModal
          open={!!selectedTaskId}
          mode={selectedTaskId === 'new' ? 'create' : 'edit'}
          workspaceId={workspaceId}
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
