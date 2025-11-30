import { type PropsWithChildren } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('card', className)}>{children}</div>;
}
