import { cn, withoutDefaults } from '@/lib/utils';

export function Skeleton({
  className,
  omitDefaults,
  ...props
}: Omit<React.ComponentProps<'div'>, 'className' | 'ref'> & { className?: string; omitDefaults?: string }) {
  return (
    <div
      className={cn(withoutDefaults('animate-pulse rounded-md bg-[var(--admin-elevated)]', omitDefaults), className)}
      {...props}
    />
  );
}
