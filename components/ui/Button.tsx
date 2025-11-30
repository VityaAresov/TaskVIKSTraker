import { type ButtonHTMLAttributes, type PropsWithChildren, cloneElement, isValidElement } from 'react';
import clsx from 'clsx';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: 'solid' | 'ghost'; size?: 'xs' | 'sm' | 'md' }
>;

export function Button({ children, className, asChild, variant = 'solid', size = 'md', ...props }: ButtonProps) {
  const base = 'rounded-md border border-border text-sm transition disabled:opacity-60';
  const variants = {
    solid: 'bg-primary text-white hover:opacity-90',
    ghost: 'bg-white text-slate-800 hover:bg-slate-50'
  };
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm'
  };
  const classes = clsx(base, variants[variant], sizes[size], className);

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
