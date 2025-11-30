import { type ButtonHTMLAttributes, type PropsWithChildren, cloneElement, isValidElement } from 'react';
import clsx from 'clsx';

export function Button({ children, className, asChild, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>) {
  const classes = clsx(
    'rounded-md border border-border bg-primary text-white px-3 py-2 text-sm hover:opacity-90 transition disabled:opacity-60',
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, {
      className: clsx((children as any).props.className, classes)
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
