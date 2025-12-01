'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subprojectId = searchParams.get('subprojectId');
  const suffix = subprojectId ? `?subprojectId=${subprojectId}` : '';
  const base = `/projects/${projectId}`;
  const tabs = [
    { id: 'board', label: 'Board', href: `${base}${suffix}` },
    { id: 'timeline', label: 'Timeline', href: `${base}/timeline${suffix}` },
    { id: 'calendar', label: 'Calendar', href: `${base}/calendar${suffix}` },
    { id: 'resources', label: 'Resources', href: `${base}/resources${suffix}` }
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
