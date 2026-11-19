import * as React from 'preact/compat';
import { cn, withoutDefaults } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, Omit<React.ComponentProps<'div'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }>(
  ({ className, omitDefaults, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(withoutDefaults('rounded-lg', omitDefaults), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, Omit<React.ComponentProps<'div'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }>(
  ({ className, omitDefaults, ...props }, ref) => (
    <div ref={ref} className={cn(withoutDefaults('flex flex-col space-y-1.5 p-6', omitDefaults), className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, Omit<React.ComponentProps<'h3'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }>(
  ({ className, omitDefaults, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(withoutDefaults('text-2xl font-semibold leading-none tracking-tight', omitDefaults), className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  Omit<React.ComponentProps<'p'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }
>(({ className, omitDefaults, ...props }, ref) => (
  <p ref={ref} className={cn(withoutDefaults('text-sm', omitDefaults), className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, Omit<React.ComponentProps<'div'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }>(
  ({ className, omitDefaults, ...props }, ref) => (
    <div ref={ref} className={cn(withoutDefaults('p-6 pt-0', omitDefaults), className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, Omit<React.ComponentProps<'div'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }>(
  ({ className, omitDefaults, ...props }, ref) => (
    <div ref={ref} className={cn(withoutDefaults('flex items-center p-6 pt-0', omitDefaults), className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };