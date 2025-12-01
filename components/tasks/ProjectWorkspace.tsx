'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '../KanbanBoard';
import { Timeline } from '../Timeline';
import { CalendarView } from '../CalendarView';
import { ResourceTable } from '../ResourceTable';
import { Tabs } from '../ui/Tabs';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import type { Task } from '../../lib/types';
import type { WorkspaceTask } from '../../lib/workspaceTypes';

type TaskWithRelations = Task & {
  task_assignees?: { user_id: string }[];
  task_dependencies?: { depends_on_task_id: string }[];
};

type Sprint = {
  id: string;
  name: string;
};

type UserLite = { id: string; full_name: string; role: string; avatar_url?: string | null };

export function ProjectWorkspace({
  tasks,
  sprints,
  users,
  projectId,
  role,
  currentUserId
}: {
  tasks: TaskWithRelations[];
  sprints: Sprint[];
  users: UserLite[];
  projectId: string;
  role: string;
  currentUserId: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    sprint: searchParams.get('sprint') ?? 'all',
    status: 'all',
    assignee: 'all',
    query: '',
    mine: false
  });

  const enrichedTasks = useMemo<WorkspaceTask[]>(() => {
    return tasks.map((task) => {
      const assignees = (task.task_assignees ?? [])
        .map((a) => users.find((u) => u.id === a.user_id))
        .filter(Boolean)
        .map((user) => ({ id: user!.id, name: user!.full_name, avatar_url: user!.avatar_url }));
      const assigneeIds = assignees.map((a) => a.id);
      return {
        ...task,
        id: String(task.id),
        parent_task_id: task.parent_task_id ? String(task.parent_task_id) : null,
        assignees,
        assigneeIds,
        comments_count: (task as any).comments_count ?? 0,
        has_children: false,
        depends_on: (task.task_dependencies ?? []).map((d) => d.depends_on_task_id)
      };
    }) as WorkspaceTask[];
  }, [tasks, users]);

  const filteredTasks = useMemo<WorkspaceTask[]>(() => {
    const sprintFilter = filters.sprint !== 'all' ? Number(filters.sprint) : null;
    return enrichedTasks.filter((task) => {
      if (sprintFilter !== null && task.sprint_id !== sprintFilter) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.assignee !== 'all') {
        const hasAssignee = (task.assignees ?? []).some((a) => a?.id === filters.assignee);
        if (!hasAssignee) return false;
      }
      if (filters.mine) {
        const mine = (task.assignees ?? []).some((a) => a?.id === currentUserId);
        if (!mine) return false;
      }
      if (filters.query) {
        const needle = filters.query.toLowerCase();
        if (!task.title.toLowerCase().includes(needle) && !(task.description ?? '').toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [enrichedTasks, filters, currentUserId]);

  const onStatusChange = async (id: string, status: Task['status']) => {
    setSelectedTaskId(id);
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  };

  const selectedTask = enrichedTasks.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.sprint}
            onChange={(e) => setFilters((f) => ({ ...f, sprint: e.target.value }))}
            className="w-40"
          >
            <option value="all">All sprints</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="w-36"
          >
            <option value="all">All status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </Select>
          <Select
            value={filters.assignee}
            onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
            className="w-36"
          >
            <option value="all">All people</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={filters.mine}
              onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked }))}
            />
            My tasks
          </label>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search tasks"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            className="w-64"
          />
          {role !== 'worker' && (
            <Button onClick={() => setSelectedTaskId('new')}>Create task</Button>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'board', label: 'Board', content: <KanbanBoard tasks={filteredTasks} onStatusChange={onStatusChange} onSelect={setSelectedTaskId} /> },
          {
            id: 'timeline',
            label: 'Timeline',
            content: (
              <Timeline
                tasks={filteredTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  due_date: t.due_date,
                  status: t.status,
                  depends_on: t.depends_on ?? []
                }))}
              />
            )
          },
          {
            id: 'calendar',
            label: 'Calendar',
            content: (
              <CalendarView tasks={filteredTasks.map((t) => ({ id: t.id, title: t.title, due_date: t.due_date, status: t.status }))} />
            )
          },
          {
            id: 'resources',
            label: 'Resources',
            content: (
              <ResourceTable
                rows={users.map((user) => {
                  const userTasks = enrichedTasks.filter((t) => (t.assignees ?? []).some((a) => a?.id === user.id));
                  const counts = userTasks.reduce(
                    (acc, t) => ({ ...acc, [t.status]: (acc[t.status as keyof typeof acc] ?? 0) + 1 }),
                    { backlog: 0, todo: 0, in_progress: 0, blocked: 0, done: 0 }
                  );
                  return { user, counts };
                })}
              />
            )
          }
        ]}
        defaultTab={searchParams.get('view') ?? undefined}
      />

      {selectedTask && selectedTaskId && (
        <TaskDetailDrawer
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          task={selectedTask}
          allTasks={enrichedTasks}
          users={users}
          role={role}
          projectId={projectId}
        />
      )}
    </div>
  );
}
