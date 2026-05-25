'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface Links {
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: (value: boolean | ((prev: boolean) => boolean)) => void;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: (value: boolean | ((prev: boolean) => boolean)) => void;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

interface SidebarBodyProps {
  className?: string;
  children?: ReactNode;
}

export const SidebarBody = (props: SidebarBodyProps) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }: SidebarBodyProps) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        'fixed left-0 top-0 h-screen px-4 py-6 hidden md:flex md:flex-col bg-[#1A1A1A] w-[240px] flex-none overflow-y-auto z-10 border-r border-[#252525]/30',
        className
      )}
      animate={{
        width: animate ? (open ? '240px' : '72px') : '240px',
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 26,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({ className, children, ...props }: SidebarBodyProps) => {
  const { open, setOpen } = useSidebar();

  return (
    <div className={cn('md:hidden')} {...props}>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className={cn(
                'fixed h-full w-[240px] inset-y-0 left-0 bg-[#1A1A1A] p-6 z-[100] flex flex-col',
                className
              )}
            >
              <div className="absolute right-6 top-6 z-50">
                <X
                  className="text-white cursor-pointer hover:text-white/80 transition-colors"
                  size={24}
                  onClick={() => setOpen(false)}
                />
              </div>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  active = false,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'>) => {
  const { open, animate } = useSidebar();

  return (
    <Link
      href={link.href}
      className={cn(
        'relative flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-lg transition-all duration-200',
        active ? 'bg-white text-[#0F0F0F]' : 'text-white/70 hover:text-white hover:bg-white/10',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex-shrink-0 transition-colors',
          active ? 'text-[#0F0F0F]' : 'text-white/70 group-hover/sidebar:text-white'
        )}
      >
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm font-medium whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
