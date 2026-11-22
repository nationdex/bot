import * as React from 'preact/compat';
import { cn, withoutDefaults } from '@/lib/utils';

export type InputProps = Omit<React.ComponentProps<'input'>, 'className' | 'ref' | 'role'> & {
  className?: string;
  omitDefaults?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, omitDefaults, id, name, ...props }, ref) => {
  // Browsers want every field to have an id or a name (autofill, accessibility tools): fall back to a stable one.
  const auto = React.useId();
  return (
    <input
      id={id ?? (name ? undefined : auto)}
      name={name}
      className={cn(
        withoutDefaults(
          'flex h-10 w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
          omitDefaults,
        ),
        className,
      )}
      ref={ref}
      {...(props as React.ComponentProps<'input'>)}
    />
  );
});
Input.displayName = 'Input';

export { Input };
