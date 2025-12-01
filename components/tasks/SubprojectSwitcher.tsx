'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export type Subproject = { id: string; name: string; parent_project_id?: string | null };

export function SubprojectSwitcher({
  projectId,
  subprojects,
  role
}: {
  projectId: string;
  subprojects: Subproject[];
  role: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = searchParams.get('subprojectId') ?? projectId;

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === projectId) {
      params.delete('subprojectId');
    } else {
      params.set('subprojectId', id);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const submitNew = async () => {
    setError(null);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, parent_project_id: projectId })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to create subproject');
      return;
    }
    const { project } = await res.json();
    setShowNew(false);
    setName('');
    setDescription('');
    handleSelect(project.id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Workspace:</span>
        <Select value={selected} onChange={(e) => handleSelect(e.target.value)} className="w-60">
          <option value={projectId}>Main project</option>
          {subprojects.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </Select>
        {role !== 'worker' && (
          <Button size="sm" variant="ghost" onClick={() => setShowNew((v) => !v)}>
            New subproject
          </Button>
        )}
      </div>
      {showNew && role !== 'worker' && (
        <Card className="p-3 flex flex-col gap-2 max-w-xl">
          <div className="text-sm font-semibold">Create subproject</div>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex gap-2">
            <Button size="sm" onClick={submitNew} disabled={!name}>
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
