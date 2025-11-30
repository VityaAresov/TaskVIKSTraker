'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';

export function Tabs({
  tabs,
  defaultTab
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={clsx(
              'px-3 py-2 rounded-md border text-sm',
              active === tab.id ? 'bg-primary text-white border-primary' : 'bg-panel border-border text-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
