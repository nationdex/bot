import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, name, ...props }, ref) => {
    // Browsers want every field to have an id or a name (autofill, accessibility tools): fall back to a stable one.
    const auto = React.useId();
    return (
      <input
        id={id ?? (name ? undefined : auto)}
        name={name}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };