'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type Mode = 'read_only' | 'full';

export function AiDrawerTrigger({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('read_only');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const disabledFull = role === 'worker';

  const ask = async () => {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, mode })
    });
    const json = await res.json();
    setAnswer(json.response ?? '');
  };

  return (
    <div className="relative">
      <Button size="sm" variant="ghost" className="flex items-center gap-2" onClick={() => setOpen((v) => !v)}>
        <span aria-hidden>✨</span> AI (beta)
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] z-30">
          <Card className="p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold">AI Assistant</div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-[80px] rounded border border-border bg-white p-2 text-sm"
              placeholder="Ask about progress, blocked tasks, or request updates"
            />
            <div className="flex items-center justify-between text-sm text-muted">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="ai-mode"
                    value="read_only"
                    checked={mode === 'read_only'}
                    onChange={() => setMode('read_only')}
                  />
                  Read only
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="ai-mode"
                    value="full"
                    checked={mode === 'full'}
                    onChange={() => setMode('full')}
                    disabled={disabledFull}
                  />
                  Full access
                </label>
              </div>
              {disabledFull && <span className="text-amber-600 text-xs">Managers/owners only</span>}
            </div>
            <Button size="sm" onClick={ask} disabled={!query}>
              Send
            </Button>
            {answer && (
              <div className="rounded border border-border bg-white p-2 text-sm text-slate-800 whitespace-pre-line">
                {answer}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
