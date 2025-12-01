'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';
import { TaskModal } from './TaskModal';
import type { WorkspaceTask } from '../../lib/workspaceTypes';

const statusTone: Record<WorkspaceTask['status'], string> = {
  backlog: 'bg-slate-100 text-slate-700',
  todo: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  blocked: 'bg-rose-100 text-rose-700',
  done: 'bg-emerald-100 text-emerald-700'
};

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
  const [monthCursor, setMonthCursor] = useState(startOfMonth(new Date()));

  const filtered = useMemo(() => {
    return items.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && !(task.assigneeIds ?? []).includes(assigneeFilter)) return false;
      return true;
    });
  }, [assigneeFilter, items, statusFilter]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const tasksByDay = useMemo(() => {
    return days.map((day) => {
      const daily = filtered.filter((task) => {
        if (!task.due_date && !task.start_date) return false;
        const start = task.start_date ? new Date(task.start_date) : task.due_date ? new Date(task.due_date) : null;
        const end = task.due_date ? new Date(task.due_date) : start;
        if (!start) return false;
        return end
          ? isWithinInterval(day, {
              start,
              end
            }) || isSameDay(day, start)
          : isSameDay(day, start);
      });
      return { day, tasks: daily };
    });
  }, [days, filtered]);

  const undated = filtered.filter((task) => !task.due_date && !task.start_date);

  const handleSaved = (task: WorkspaceTask) => {
    setItems((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)) : [...prev, task];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setMonthCursor(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button variant="ghost" onClick={() => setMonthCursor((d) => addDays(startOfMonth(d), -1))}>
            ←
          </Button>
          <Button variant="ghost" onClick={() => setMonthCursor((d) => addDays(endOfMonth(d), 1))}>
            →
          </Button>
          {role !== 'worker' && (
            <Button onClick={() => setSelectedTaskId('new')} className="shadow-sm">
              Create task
            </Button>
          )}
        </div>
      </div>

      <Card className="p-3">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>{format(monthCursor, 'MMMM yyyy')}</span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-muted">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-2">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {tasksByDay.map(({ day, tasks: dayTasks }) => (
            <div
              key={day.toISOString()}
              className={`min-h-[110px] rounded-md border border-border bg-panel p-2 text-xs ${
                isSameMonth(day, monthCursor) ? '' : 'opacity-60'
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
                <span>{format(day, 'd')}</span>
                {dayTasks.length > 0 && <Badge label={`${dayTasks.length}`} />}
              </div>
              <div className="flex flex-col gap-1">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`flex flex-col rounded border border-border px-2 py-1 text-left ${statusTone[task.status]}`}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <span className="text-[11px] font-semibold line-clamp-1">{task.title}</span>
                    <div className="text-[10px] text-muted">
                      {task.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}
                    </div>
                    <Progress value={(task.progress_current / Math.max(task.progress_target, 1)) * 100} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {undated.length > 0 && (
        <Card className="p-3 space-y-2">
          <div className="text-sm font-semibold">Tasks without dates</div>
          <div className="flex flex-col gap-2">
            {undated.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded border border-border bg-panel px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-semibold">{task.title}</div>
                  <div className="text-xs text-muted">{task.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={task.status} />
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTaskId(task.id)}>
                    Set dates
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
