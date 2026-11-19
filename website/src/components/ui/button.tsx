import * as React from 'preact/compat';

import { cn, withoutDefaults } from '@/lib/utils';

// Only the variants that carry styles; the shadcn colour variants never had a theme behind them.
const variantClass = {
  outline: 'border',
  link: 'underline-offset-4 hover:underline',
};

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

export type ButtonProps = Omit<React.ComponentProps<'button'>, 'className' | 'ref'> & {
  className?: string;
  omitDefaults?: string;
  variant?: Variant;
  size?: keyof typeof sizes;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, omitDefaults, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      className={cn(
        withoutDefaults('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50', omitDefaults),
        withoutDefaults(variantClass[variant as keyof typeof variantClass] ?? '', omitDefaults),
        withoutDefaults(sizes[size], omitDefaults),
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button };