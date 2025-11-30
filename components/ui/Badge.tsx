import clsx from 'clsx';

export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'success' | 'warning' | 'critical' }) {
  const tones: Record<typeof tone, string> = {
    muted: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  } as const;
  return <span className={clsx('px-2 py-1 text-xs rounded-md border', tones[tone])}>{label}</span>;
}
