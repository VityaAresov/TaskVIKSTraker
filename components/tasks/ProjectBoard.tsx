'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard, type Task } from '../KanbanBoard';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TaskModal } from './TaskModal';

export function ProjectBoard({
  tasks,
  role,
  currentUserId,
  users,
  workspaceId
}: {
  tasks: (Task & { assigneeIds?: string[] })[];
  role: string;
  currentUserId: string;
  users?: { id: string; full_name: string; role: string; avatar_url?: string | null }[];
  workspaceId: number;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(tasks);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const assigneeOptions = useMemo(() => {
    const uniques = new Map<string, string>();
    tasks.forEach((task) => {
      (task.assignees ?? []).forEach((a) => {
        if (a?.id) uniques.set(a.id, a.name);
      });
    });
    return Array.from(uniques.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filtered = useMemo(() => {
    return items.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (assigneeFilter !== 'all') {
        const match = (task.assignees ?? []).some((a) => a?.id === assigneeFilter);
        if (!match) return false;
      }
      if (query) {
        const needle = query.toLowerCase();
        if (!task.title.toLowerCase().includes(needle) && !(task.description ?? '').toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, assigneeFilter, query]);

  const handleStatusChange = async (id: string, status: Task['status']) => {
    const task = items.find((t) => t.id === id);
    if (!task) return;
    const canUpdate = role !== 'worker' || (task.assigneeIds ?? []).includes(currentUserId);
    if (!canUpdate) return;

    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const resp = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!resp.ok) {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)));
      setError('Could not update task status. Please retry.');
    } else {
      setError(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="all">All status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </Select>
          <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="w-40">
            <option value="all">All assignees</option>
            {assigneeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </Select>
          <Input
            className="w-60"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.refresh()}>
            Refresh
          </Button>
          {role !== 'worker' && (
            <Button onClick={() => setShowCreate(true)} className="shadow-sm">
              Create task
            </Button>
          )}
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <KanbanBoard
        tasks={filtered}
        onStatusChange={handleStatusChange}
        onSelect={(id) => setEditingTaskId(id)}
      />

      <TaskModal
        open={showCreate}
        mode="create"
        workspaceId={workspaceId}
        users={users ?? []}
        role={role}
        currentUserId={currentUserId}
        onClose={() => setShowCreate(false)}
        onSaved={(task) => setItems((prev) => [...prev, task])}
      />

      {editingTaskId && (
        <TaskModal
          open={Boolean(editingTaskId)}
          mode="edit"
          workspaceId={workspaceId}
          users={users ?? []}
          role={role}
          currentUserId={currentUserId}
          initialTask={items.find((t) => t.id === editingTaskId)}
          onClose={() => setEditingTaskId(null)}
          onSaved={(task) =>
            setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)))
          }
        />
      )}
    </div>
  );
}
