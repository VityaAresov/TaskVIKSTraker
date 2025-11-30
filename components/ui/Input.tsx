import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary',
        props.className
      )}
      {...props}
    />
  );
});
