import { type ReactNode } from 'preact/compat';
import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

export const SIDEBAR_WIDTH = 256;

interface SidebarContextProps {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: (value: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}
