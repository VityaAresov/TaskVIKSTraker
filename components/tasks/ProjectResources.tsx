'use client';

import { useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Select } from '../ui/Select';
import type { WorkspaceTask } from '../../lib/workspaceTypes';

export function ProjectResources({
  tasks,
  users,
  role,
  currentUserId
}: {
  tasks: WorkspaceTask[];
  users: { id: string; full_name: string; role: string; avatar_url?: string | null }[];
  role: string;
  currentUserId: string;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');

  const eligibleUsers = useMemo(() => {
    if (role === 'worker') {
      return users.filter((u) => u.id === currentUserId);
    }
    return users;
  }, [currentUserId, role, users]);

  const sprintOptions = useMemo(() => {
    const ids = new Set<number>();
    tasks.forEach((t) => {
      if (t.sprint_id !== null && t.sprint_id !== undefined) ids.add(t.sprint_id);
    });
    return Array.from(ids);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (sprintFilter !== 'all' && task.sprint_id !== Number(sprintFilter)) return false;
      return true;
    });
  }, [sprintFilter, statusFilter, tasks]);

  const rows = eligibleUsers.map((user) => {
    const userTasks = filteredTasks.filter((t) => (t.assigneeIds ?? []).includes(user.id));
    const counts = userTasks.reduce(
      (acc, t) => ({ ...acc, [t.status]: (acc[t.status as keyof typeof acc] ?? 0) + 1 }),
      { backlog: 0, todo: 0, in_progress: 0, blocked: 0, done: 0 }
    );
    const progressSum = userTasks.reduce(
      (acc, t) => ({
        current: acc.current + (t.progress_current ?? 0),
        target: acc.target + (t.progress_target ?? 0)
      }),
      { current: 0, target: 0 }
    );
    const overall = progressSum.target === 0 ? 0 : (progressSum.current / progressSum.target) * 100;
    return { user, counts, overall, tasks: userTasks };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All status</option>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Select>
        <Select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)} className="w-40">
          <option value="all">All sprints</option>
          {sprintOptions.map((id) => (
            <option key={id} value={id}>
              Sprint {id}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const total = Object.values(row.counts).reduce((sum, v) => sum + v, 0);
          return (
            <Card key={row.user.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{row.user.full_name}</div>
                  <div className="text-xs text-muted">{row.user.role}</div>
                </div>
                <div className="text-xs text-muted">{total} tasks</div>
              </div>
              <Progress value={row.overall} />
              <div className="text-xs text-muted">
                Backlog {row.counts.backlog} · Todo {row.counts.todo} · In progress {row.counts.in_progress} · Blocked {row.counts.blocked} · Done {row.counts.done}
              </div>
              {row.tasks.length > 0 && (
                <div className="space-y-1 pt-1">
                  {row.tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-xs text-muted">
                      <span className="truncate">{task.title}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px]">{task.status}</span>
                    </div>
                  ))}
                  {row.tasks.length > 4 && (
                    <div className="text-[11px] text-muted">+{row.tasks.length - 4} more</div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {rows.length === 0 && <Card className="p-4 text-sm text-muted">No assignments found for this workspace.</Card>}
      </div>
    </div>
  );
}
