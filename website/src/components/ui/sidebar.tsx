import { AnimatePresence, type HTMLMotionProps, m } from 'framer-motion';
import type { ReactNode } from 'react';
import { SIDEBAR_WIDTH, SidebarProvider, useSidebar } from '@/components/ui/sidebar-context';
import { useIs3DEnabled, useMotionPref } from '@/hooks/useReducedMotion';
import { admin } from '@/lib/admin-classes';
import { springSnappy } from '@/lib/motion';
import { cn } from '@/lib/utils';

export { SIDEBAR_WIDTH } from '@/components/ui/sidebar-context';

interface Links {
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
}

export function Sidebar({
  children,
  open,
  setOpen,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: (value: boolean | ((prev: boolean) => boolean)) => void;
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen}>
      {children}
    </SidebarProvider>
  );
}

interface SidebarBodyProps {
  className?: string;
  children?: ReactNode;
}

export function SidebarBody(props: SidebarBodyProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
}

function DesktopSidebar({ className, children, ...props }: SidebarBodyProps) {
  return (
    <aside
      data-sidebar-desktop
      className={cn(
        'fixed left-3 top-3 bottom-3 z-30 hidden w-64 flex-col rounded-2xl overflow-hidden md:flex',
        'md:left-4 md:top-4 md:bottom-4',
        admin.sidebar
      )}
      style={{ width: SIDEBAR_WIDTH }}
      {...props}
    >
      <div className={cn('flex h-full min-h-0 flex-col justify-between', className)}>{children}</div>
    </aside>
  );
}

function MobileSidebar({ className, children, ...props }: SidebarBodyProps) {
  const { open, setOpen } = useSidebar();
  const pageTransitions = useMotionPref('pageTransitions');

  return (
    <div className="md:hidden" {...props}>
      <AnimatePresence>
        {open && (
          <>
            {pageTransitions ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
            ) : (
              <div
                className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
            )}
            {pageTransitions ? (
              <m.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className={cn('fixed inset-y-0 left-0 z-[100] flex w-64 flex-col', admin.sidebar)}
                style={{ width: SIDEBAR_WIDTH }}
              >
                <div className={cn('flex min-h-0 flex-1 flex-col justify-between', className)}>
                  {children}
                </div>
              </m.aside>
            ) : (
              <aside
                className={cn('fixed inset-y-0 left-0 z-[100] flex w-64 flex-col', admin.sidebar)}
                style={{ width: SIDEBAR_WIDTH }}
              >
                <div className={cn('flex min-h-0 flex-1 flex-col justify-between', className)}>
                  {children}
                </div>
              </aside>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

type SidebarLinkProps = {
  link: Links;
  active?: boolean;
} & Omit<HTMLMotionProps<'a'>, 'href' | 'children'>;

export function SidebarLink({ link, className, active = false, ...props }: SidebarLinkProps) {
  const enable3D = useIs3DEnabled();
  const hoverFeedback = useMotionPref('hoverFeedback');

  return (
    <m.a
      href={link.href}
      whileHover={
        !hoverFeedback
          ? undefined
          : active
            ? { scale: 1.01 }
            : enable3D
              ? { x: 3, rotateY: 8, z: 6 }
              : { x: 3 }
      }
      whileTap={hoverFeedback ? { scale: 0.98 } : undefined}
      transition={springSnappy}
      style={enable3D ? { transformPerspective: 900 } : undefined}
      className={cn(
        'preserve-3d relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'text-[var(--admin-accent-fg)]' : cn(admin.muted, 'hover:text-[var(--admin-fg)]'),
        className
      )}
      {...props}
    >
      {active && (
        <m.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-lg bg-[var(--admin-accent)]"
          transition={springSnappy}
        />
      )}
      <span
        className={cn(
          'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center',
          active ? 'text-[var(--admin-accent-fg)]' : admin.muted
        )}
      >
        {link.icon}
      </span>
      <span className="relative z-10 truncate">{link.label}</span>
    </m.a>
  );
}