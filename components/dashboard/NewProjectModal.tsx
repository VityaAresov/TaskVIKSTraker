'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export function NewProjectModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const resp = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        setError(payload.error ?? 'Unable to create project');
        return;
      }
      const data = await resp.json();
      const projectId = data.project?.id;
      setOpen(false);
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        setError('Project created but no id returned.');
      }
    });
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-flex">
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <Card className="w-full max-w-md space-y-4 p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted">Create project</div>
                <div className="text-lg font-semibold">New workspace</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted text-sm">✕</button>
            </div>
            <div className="space-y-3">
              <label className="space-y-1 text-sm">
                <span className="text-muted">Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted">Description</span>
                <textarea
                  className="w-full rounded-md border border-border bg-panel p-2 text-sm"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Creating...' : 'Create & open'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
