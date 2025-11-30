import { type HTMLAttributes, type PropsWithChildren } from 'react';
import clsx from 'clsx';

export function Card({ children, className, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={clsx('card', className)} {...rest}>
      {children}
    </div>
  );
}
