'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import type { Task } from '../KanbanBoard';

export type TaskModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  workspaceId: number;
  users: { id: string; full_name: string; role: string; avatar_url?: string | null }[];
  role: string;
  currentUserId: string;
  initialTask?: Task & { assigneeIds?: string[] };
  onClose: () => void;
  onSaved: (task: Task & { assigneeIds?: string[]; comments_count?: number }) => void;
};

type Comment = { id: string; body: string; author_id: string; created_at: string; users?: { full_name: string } };

export function TaskModal({
  open,
  mode,
  workspaceId,
  users,
  role,
  currentUserId,
  initialTask,
  onClose,
  onSaved
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | ''>('');
  const [startDate, setStartDate] = useState<string | ''>('');
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTarget, setProgressTarget] = useState(100);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = role !== 'worker';
  const canEditCore = canManage || (mode === 'edit' && (initialTask?.assigneeIds ?? []).includes(currentUserId));

  useEffect(() => {
    if (!open) return;
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description ?? '');
      setStatus(initialTask.status);
      setAssigneeIds(initialTask.assigneeIds ?? []);
      setDueDate(initialTask.due_date ?? '');
      setStartDate(initialTask.start_date ?? '');
      setProgressCurrent(initialTask.progress_current ?? 0);
      setProgressTarget(initialTask.progress_target ?? 100);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setAssigneeIds([]);
      setDueDate('');
      setStartDate('');
      setProgressCurrent(0);
      setProgressTarget(100);
    }
  }, [initialTask, open]);

  useEffect(() => {
    const loadComments = async () => {
      if (mode === 'edit' && initialTask?.id) {
        const res = await fetch(`/api/tasks/${initialTask.id}/comments`);
        const json = await res.json();
        setComments(json.comments ?? []);
      } else {
        setComments([]);
      }
    };
    if (open) loadComments();
  }, [initialTask?.id, mode, open]);

  const handleAssigneeChange = (ids: string[]) => {
    setAssigneeIds(ids);
  };

  const saveTask = async () => {
    setSaving(true);
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      setSaving(false);
      return;
    }

    if (mode === 'create') {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: workspaceId,
          title,
          description,
          status,
          progress_current: progressCurrent,
          progress_target: progressTarget,
          due_date: dueDate || null,
          start_date: startDate || null,
          assignees: assigneeIds
        })
      });
      const json = await res.json();
      setSaving(false);
      if (!res.ok) {
        setError(json.error || 'Failed to create task');
        return;
      }
      const assignees = users
        .filter((u) => assigneeIds.includes(u.id))
        .map((u) => ({ id: u.id, name: u.full_name, avatar_url: u.avatar_url }));
      onSaved({
        id: json.task.id,
        project_id: workspaceId,
        title,
        description,
        status,
        progress_current: progressCurrent,
        progress_target: progressTarget,
        assignees,
        due_date: dueDate || null,
        start_date: startDate || null,
        depends_on: [],
        visible_to_role: 'all',
        visible_to_user_ids: null,
        priority: 'medium',
        comments_count: 0,
        has_children: false,
        assigneeIds
      });
      onClose();
      return;
    }

    if (!initialTask) return;

    const payload: Record<string, any> = {
      status,
      progress_current: progressCurrent,
      progress_target: progressTarget,
      due_date: dueDate || null,
      start_date: startDate || null,
      title,
      description
    };

    if (canManage) {
      payload.assignees = assigneeIds;
    }

    const res = await fetch(`/api/tasks/${initialTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || 'Failed to update task');
      return;
    }

    const assignees = users
      .filter((u) => (assigneeIds.length ? assigneeIds : initialTask.assigneeIds ?? []).includes(u.id))
      .map((u) => ({ id: u.id, name: u.full_name, avatar_url: u.avatar_url }));

    onSaved({
      ...(initialTask as Task),
      ...json.task,
      assignees,
      assigneeIds: assigneeIds.length ? assigneeIds : initialTask.assigneeIds,
      start_date: startDate || null,
      comments_count: comments.length
    });
    onClose();
  };

  const addComment = async () => {
    if (!newComment.trim() || !initialTask) return;
    const res = await fetch(`/api/tasks/${initialTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment })
    });
    if (res.ok) {
      const refreshed = await fetch(`/api/tasks/${initialTask.id}/comments`).then((r) => r.json());
      setComments(refreshed.comments ?? []);
      setNewComment('');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-3 py-6" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-xs text-muted">{mode === 'create' ? 'New task' : 'Task details'}</div>
            <div className="text-lg font-semibold">{title || 'Untitled task'}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-lg text-muted">×</button>
        </div>

        <div className="grid gap-4 px-4 py-3 md:grid-cols-2">
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <textarea
              className="w-full rounded-md border border-border p-2 text-sm"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <span className="text-xs text-muted">Status</span>
                <Select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted">Start date</span>
                <Input type="date" value={startDate ?? ''} onChange={(e) => setStartDate(e.target.value)} disabled={!canManage} />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted">Due date</span>
                <Input type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.target.value)} />
              </label>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Progress</span>
                <span>
                  {progressCurrent} / {Math.max(progressTarget, 1)}
                </span>
              </div>
              <Progress value={(progressCurrent / Math.max(progressTarget || 1, 1)) * 100} />
              <input
                type="range"
                min={0}
                max={Math.max(progressTarget, 1)}
                value={progressCurrent}
                onChange={(e) => setProgressCurrent(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={progressCurrent}
                  onChange={(e) => setProgressCurrent(Number(e.target.value))}
                  disabled={!canEditCore}
                />
                <Input
                  type="number"
                  value={progressTarget}
                  onChange={(e) => setProgressTarget(Number(e.target.value))}
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Assignees</span>
                {!canManage && <Badge label="view only" />}
              </div>
              <select
                multiple
                className="w-full rounded-md border border-border p-2 text-sm"
                value={assigneeIds}
                onChange={(e) =>
                  handleAssigneeChange(Array.from(e.target.selectedOptions).map((opt) => opt.value))
                }
                disabled={!canManage}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'edit' && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Comments</span>
                  <Badge label={`${comments.length}`} />
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded border border-border p-2">
                  {comments.length === 0 && <div className="text-xs text-muted">No comments yet.</div>}
                  {comments.map((c) => (
                    <div key={c.id} className="space-y-1 rounded bg-slate-50 p-2">
                      <div className="text-[11px] text-muted">
                        {c.users?.full_name ?? c.author_id} · {new Date(c.created_at).toLocaleString()}
                      </div>
                      <div>{c.body}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addComment();
                    }}
                  />
                  <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="px-4 pb-2 text-xs text-red-600">{error}</div>}

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveTask} disabled={saving}>
            {mode === 'create' ? 'Create task' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  return modalContent;
}
