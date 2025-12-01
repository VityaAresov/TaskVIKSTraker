'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const tabs = [
    { id: 'board', label: 'Board', href: `${base}` },
    { id: 'timeline', label: 'Timeline', href: `${base}/timeline` },
    { id: 'calendar', label: 'Calendar', href: `${base}/calendar` },
    { id: 'resources', label: 'Resources', href: `${base}/resources` }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href.replace(/\?.*/, '');
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-primary text-white border-primary' : 'bg-panel border-border text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
