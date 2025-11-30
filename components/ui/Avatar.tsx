import Image from 'next/image';
import clsx from 'clsx';

type AvatarProps = {
  src?: string | null;
  fallback: string;
  size?: 'sm' | 'md';
};

export function Avatar({ src, fallback, size = 'md' }: AvatarProps) {
  const dimension = size === 'sm' ? 28 : 40;
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 overflow-hidden border border-border',
        size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
      )}
    >
      {src ? (
        <Image alt={fallback} src={src} width={dimension} height={dimension} className="object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}
