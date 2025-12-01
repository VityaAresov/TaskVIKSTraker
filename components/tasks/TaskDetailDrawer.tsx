'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { Task } from '../KanbanBoard';

type AssigneeLite = { id: string; name: string; avatar_url?: string | null };

type TaskWithAssignees = Task & {
  assignees?: AssigneeLite[];
  depends_on?: string[];
};

type Comment = { id: string; body: string; author_id: string; created_at: string; users?: { full_name: string } };

export function TaskDetailDrawer({
  open,
  onClose,
  task,
  allTasks,
  users,
  role,
  projectId
}: {
  open: boolean;
  onClose: () => void;
  task: TaskWithAssignees;
  allTasks: TaskWithAssignees[];
  users: { id: string; full_name: string; role: string; avatar_url?: string | null }[];
  role: string;
  projectId: string;
}) {
  const [progressCurrent, setProgressCurrent] = useState(task.progress_current);
  const [status, setStatus] = useState<Task['status']>(task.status);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibleToRole, setVisibleToRole] = useState(task.visible_to_role ?? 'all');
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>(task.visible_to_user_ids ?? []);
  const target = task.progress_target ?? 1;

  const subtasks = useMemo(() => allTasks.filter((t) => t.parent_task_id === task.id), [allTasks, task.id]);
  const subtasksProgress = useMemo(() => {
    if (subtasks.length === 0) return null;
    const avg =
      subtasks.reduce(
        (acc, st) =>
          acc + (st.progress_current / Math.max(st.progress_target ?? 1, 1)) * 100,
        0
      ) / subtasks.length;
    return Math.round(avg);
  }, [subtasks]);

  useEffect(() => {
    if (!open) return;
    const loadComments = async () => {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      const json = await res.json();
      setComments(json.comments ?? []);
    };
    loadComments();
  }, [open, task.id]);

  const updateTask = async (payload: Partial<Task>) => {
    setLoading(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
  };

  const saveProgress = async () => {
    await updateTask({
      progress_current: progressCurrent,
      status,
      visible_to_role: visibleToRole as Task['visible_to_role'],
      visible_to_user_ids: visibleUserIds
    });
  };

  const addComment = async () => {
    if (!newComment) return;
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment })
    });
    setNewComment('');
    const res = await fetch(`/api/tasks/${task.id}/comments`);
    const json = await res.json();
    setComments(json.comments ?? []);
  };

  const sendReminder = async () => {
    await fetch(`/api/tasks/${task.id}/remind`, { method: 'POST' });
  };

  const parentTask = allTasks.find((t) => t.id === task.parent_task_id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
      <div className="h-full w-full sm:w-[520px] bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-xs text-muted">Task detail</div>
            <div className="text-lg font-semibold">{task.title}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-600">×</button>
        </div>

        <div className="p-4 space-y-4">
          {parentTask && <div className="text-xs text-muted">Subtask of: {parentTask.title}</div>}
          <div className="text-sm text-muted whitespace-pre-line">{task.description}</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Status</span>
                <Badge label={status} tone={status === 'blocked' ? 'critical' : 'muted'} />
              </div>
              <Select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </Select>
            </div>
              <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="text-xs text-muted">{progressCurrent} / {target}</span>
              </div>
              <Progress value={(progressCurrent / Math.max(target, 1)) * 100} />
              <input
                type="range"
                min={0}
                max={target}
                value={progressCurrent}
                onChange={(e) => setProgressCurrent(Number(e.target.value))}
                className="w-full"
              />
              <Input type="number" value={progressCurrent} onChange={(e) => setProgressCurrent(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Assignees</div>
            <div className="flex flex-wrap gap-2">
              {(task.assignees ?? []).map((assignee) => (
                <div key={assignee?.id} className="flex items-center gap-2 rounded border border-border px-2 py-1 text-sm">
                  <Avatar fallback={assignee?.name?.[0] ?? '?'} size="sm" src={assignee?.avatar_url} />
                  {assignee?.name}
                </div>
              ))}
              {role !== 'worker' && <span className="text-xs text-muted">Manage assignees in task editor</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Visibility & access</div>
            <Select value={visibleToRole} onChange={(e) => setVisibleToRole(e.target.value as any)} disabled={role === 'worker'}>
              <option value="all">All</option>
              <option value="workers_and_above">Workers and above</option>
              <option value="managers_and_above">Managers and above</option>
              <option value="owners_only">Owners only</option>
            </Select>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {(visibleUserIds ?? []).map((id) => {
                const u = users.find((user) => user.id === id);
                return u ? <Badge key={id} label={u.full_name} /> : null;
              })}
              {role !== 'worker' && <span>Add specifics in task editor</span>}
            </div>
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Subtasks</span>
                {subtasksProgress !== null && <span className="text-xs text-muted">Avg {subtasksProgress}%</span>}
              </div>
              <div className="space-y-1">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between rounded border border-border px-2 py-1 text-sm">
                    <div>{st.title}</div>
                    <Badge label={st.status} tone={st.status === 'blocked' ? 'critical' : 'muted'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Comments</div>
              <span className="text-xs text-muted">Notify assignees</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded border border-border p-2 text-sm">
                  <div className="text-xs text-muted">
                    {comment.users?.full_name ?? comment.author_id} · {new Date(comment.created_at).toLocaleString()}
                  </div>
                  <div>{comment.body}</div>
                </div>
              ))}
              {comments.length === 0 && <div className="text-xs text-muted">No comments yet.</div>}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Share an update"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addComment();
                }}
              />
              <Button size="sm" onClick={addComment} disabled={!newComment}>
                Post
              </Button>
            </div>
          </div>

          {role !== 'worker' && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Reminders</div>
              <Button size="sm" variant="ghost" onClick={sendReminder}>
                Send reminder email
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={saveProgress} disabled={loading}>
              Save updates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
