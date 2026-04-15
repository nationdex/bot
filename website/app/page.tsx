// Next.js client component
'use client';

// Import motion components from framer-motion
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Cog,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  Search,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BotConfig from '@/components/BotConfig';
import Dashboard from '@/components/Dashboard';
import Logs from '@/components/Logs';
import Nations from '@/components/Nations';
import UsersPage from '@/components/Users';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useIsMobile } from '@/lib/hooks';
import { cn } from '@/lib/utils';

// Main home page component
export default function Home() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setOpen(true);
    }
  }, []);

  const links = [
    {
      label: 'Dashboard',
      href: '#',
      icon: <LayoutDashboard className="h-5 w-5" />,
      id: 'dashboard',
    },
    {
      label: 'Bot Config',
      href: '#',
      icon: <Cog className="h-5 w-5" />,
      id: 'bot-config',
    },
    {
      label: 'Users',
      href: '#',
      icon: <Users className="h-5 w-5" />,
      id: 'users',
    },
    {
      label: 'Nations',
      href: '#',
      icon: <Globe className="h-5 w-5" />,
      id: 'nations',
    },
    {
      label: 'Logs',
      href: '#',
      icon: <FileText className="h-5 w-5" />,
      id: 'logs',
    },
  ];

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setCurrentSection(id);
    if (isMobile) {
      setOpen(false);
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'bot-config':
        return <BotConfig />;
      case 'users':
        return <UsersPage />;
      case 'nations':
        return <Nations />;
      case 'logs':
        return <Logs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1A1A1A] relative">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8 border-none">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {open ? <Logo /> : <LogoIcon />}
            </motion.div>
            <div className="mt-8 flex flex-col gap-1.5">
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                  }}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className="cursor-pointer"
                >
                  <SidebarLink link={link} active={currentSection === link.id} />
                </motion.div>
              ))}
            </div>
          </div>
          <SidebarUserProfile open={open} />
        </SidebarBody>
      </Sidebar>

      <MainContentWrapper open={open}>
        <main className="flex flex-col h-[calc(100vh-32px)] bg-[#0F0F0F] rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl rounded-br-2xl relative z-20 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none z-30"></div>
          <header className="sticky top-0 z-40 bg-[#0F0F0F] border-b border-[#1A1A1A]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-base sm:text-lg">
                    Admin Overview
                  </span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 bg-[#1A1A1A] rounded-lg p-1 overflow-x-auto">
                {links.slice(0, 5).map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={cn(
                      'px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                      currentSection === link.id
                        ? 'bg-white text-[#0F0F0F]'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-2 sm:gap-4">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 cursor-pointer hover:text-white hidden sm:block" />

                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="md:hidden text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </MainContentWrapper>
    </div>
  );
}

// Main content wrapper component
const MainContentWrapper = ({ children, open }: { children: React.ReactNode; open: boolean }) => {
  const isMobile = useIsMobile();

  return (
    <motion.div
      className="flex-1 min-h-screen"
      animate={{
        marginLeft: isMobile ? '0px' : open ? '256px' : '88px',
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 26,
      }}
    >
      <div className="h-full p-3 overflow-y-auto md:p-4 lg:-ml-3 lg:pl-1 lg:pr-6">{children}</div>
    </motion.div>
  );
};

// Logo component
const Logo = () => {
  return (
    <Link href="#" className="font-normal flex space-x-3 items-center text-sm py-2 relative z-20">
      <Image
        src="/assets/nationdexlogo.png"
        alt="Nationdex"
        width={40}
        height={40}
        className="object-contain"
      />
      <span className="font-semibold text-white text-lg">Nationdex</span>
    </Link>
  );
};

// Logo icon component
const LogoIcon = () => {
  return (
    <Link href="#" className="font-normal flex items-center text-sm py-2 relative z-20">
      <Image
        src="/assets/nationdexlogo.png"
        alt="Nationdex"
        width={40}
        height={40}
        className="object-contain"
      />
    </Link>
  );
};

// Sidebar user profile component
const SidebarUserProfile = ({ open }: { open: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="mt-auto"
    >
      {open ? (
        <div className="bg-[#1f1f1f] rounded-xl px-3 py-2 border border-[#2b2b2b] shadow-[0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-white text-sm font-semibold border border-[#333] flex-shrink-0">
                ND
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-white leading-tight truncate">Admin</span>
                <span className="text-xs text-white/50 truncate">admin@arielaram.com</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <ChevronUp className="w-3 h-3 text-white/40" />
              <ChevronDown className="w-3 h-3 text-white/40" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#1f1f1f] flex items-center justify-center text-white text-sm font-semibold border border-[#2b2b2b] shadow-[0_1px_0_rgba(255,255,255,0.04)]">
            ND
          </div>
        </div>
      )}
    </motion.div>
  );
};
