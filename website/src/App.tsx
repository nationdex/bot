import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Globe, LayoutDashboard, Menu, Settings as SettingsIcon, Users } from 'lucide-react';
import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import HeaderSearch from '@/components/HeaderSearch';
import Nations from '@/components/Nations';
import Settings from '@/components/Settings';
import UsersPage from '@/components/Users';
import { SIDEBAR_WIDTH, Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import { bot } from '@/lib/bot';
import {
  fadeUp,
  flipIn3D,
  pageTransition3D,
  pageTransitionFlat,
  pageTransitionNone,
  perspectiveDefault,
  slideInLeft,
  spring3D,
  staggerContainer,
} from '@/lib/motion';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  nations: bot.collectible.plural.charAt(0).toUpperCase() + bot.collectible.plural.slice(1),
  settings: 'Settings',
};

export default function App() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectionFilterQuery, setSectionFilterQuery] = useState('');
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();
  const pageMotion = reducedMotion
    ? pageTransitionNone
    : enable3D
      ? pageTransition3D
      : pageTransitionFlat;

  const headerTitleMotion = reducedMotion
    ? pageTransitionNone
    : enable3D
      ? flipIn3D
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -4 },
          transition: { duration: 0.18 },
        };

  const handleGlobalNavigate = (section: string, filterQuery?: string) => {
    setCurrentSection(section);
    setSectionFilterQuery(filterQuery ?? '');
    setMobileOpen(false);
  };

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setCurrentSection(id);
    setSectionFilterQuery('');
    setMobileOpen(false);
  };
  const links = [
    {
      label: 'Dashboard',
      href: '#',
      icon: <LayoutDashboard className="h-5 w-5" />,
      id: 'dashboard',
    },
    {
      label: 'Users',
      href: '#',
      icon: <Users className="h-5 w-5" />,
      id: 'users',
    },
    {
      label: sectionTitles.nations,
      href: '#',
      icon: <Globe className="h-5 w-5" />,
      id: 'nations',
    },
    {
      label: 'Settings',
      href: '#',
      icon: <SettingsIcon className="h-5 w-5" />,
      id: 'settings',
    },
  ];

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard logSearchQuery={sectionFilterQuery} />;
      case 'users':
        return <UsersPage searchQuery={sectionFilterQuery} />;
      case 'nations':
        return <Nations searchQuery={sectionFilterQuery} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard logSearchQuery={sectionFilterQuery} />;
    }
  };

  const sidebarContent = (
    <>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4 pt-5 md:pt-6">
        <Logo />

        <nav className="flex flex-col gap-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Menu
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-1"
          >
            {links.map((link) => (
              <motion.div
                key={link.id}
                variants={slideInLeft}
                onClick={(e) => handleLinkClick(e, link.id)}
                className="cursor-pointer"
              >
                <SidebarLink link={link} active={currentSection === link.id} />
              </motion.div>
            ))}
          </motion.div>
        </nav>
      </div>

      <SidebarUserProfile />
    </>
  );

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <Sidebar open={mobileOpen} setOpen={setMobileOpen}>
          <SidebarBody className="flex h-full flex-col justify-between">
            {sidebarContent}
          </SidebarBody>
        </Sidebar>

        <div
          className="min-h-screen transition-[margin] duration-200 md:ml-[var(--sidebar-width)]"
          style={{ ['--sidebar-width' as string]: `${SIDEBAR_WIDTH}px` }}
        >
          <div className="min-h-screen p-3 md:p-4 perspective-scene">
            <motion.main
              initial={
                reducedMotion
                  ? false
                  : enable3D
                    ? { opacity: 0, rotateX: 6, y: 24, scale: 0.985 }
                    : { opacity: 0, y: 16, scale: 0.99 }
              }
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              transition={reducedMotion ? { duration: 0 } : { ...spring3D, delay: 0.05 }}
              style={enable3D ? { transformPerspective: perspectiveDefault } : undefined}
              className="preserve-3d gpu-layer flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-[#252525] bg-[#0F0F0F] md:min-h-[calc(100vh-2rem)]"
            >
              <header className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#0F0F0F]/95 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSection}
                        {...headerTitleMotion}
                        style={enable3D ? { transformPerspective: 900 } : undefined}
                        className={enable3D ? 'preserve-3d' : undefined}
                      >
                        <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                          {sectionTitles[currentSection] ?? 'Admin'}
                        </h1>
                        <p className="truncate text-xs text-white/40">
                          {bot.name} v{bot.version}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <HeaderSearch onNavigate={handleGlobalNavigate} />

                    <motion.button
                      type="button"
                      onClick={() => setMobileOpen(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
                      aria-label="Open menu"
                    >
                      <Menu className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </header>

              <div className="perspective-scene flex-1 overflow-y-auto p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSection}
                    {...pageMotion}
                    className="preserve-3d gpu-layer"
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.main>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

const Logo = () => {
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();

  return (
    <motion.div
      role="img"
      aria-label={`${bot.name} logo`}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      whileHover={
        reducedMotion ? undefined : enable3D ? { scale: 1.02, rotateY: 6 } : { scale: 1.02 }
      }
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      style={enable3D ? { transformPerspective: 800 } : undefined}
      className="preserve-3d flex items-center gap-3 rounded-lg px-2 py-1.5"
    >
      <motion.img
        src="/assets/nationdexlogo.png"
        alt="Nationdex"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
        animate={reducedMotion || !enable3D ? undefined : { rotate: [0, -3, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="min-w-0">
        <span className="block truncate text-base font-semibold text-white">{bot.name}</span>
        <span className="block truncate text-[10px] text-white/40">Admin panel</span>
      </div>
    </motion.div>
  );
};

const SidebarUserProfile = () => {
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: reducedMotion ? 0 : 0.2 }}
      className="shrink-0 border-t border-[#2a2a2a] p-4"
    >
      <motion.div
        whileHover={
          reducedMotion
            ? undefined
            : enable3D
              ? { scale: 1.02, rotateX: 4, rotateY: -4, borderColor: 'rgba(255,255,255,0.12)' }
              : { scale: 1.02, borderColor: 'rgba(255,255,255,0.12)' }
        }
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        style={enable3D ? { transformPerspective: 900 } : undefined}
        className="preserve-3d flex items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5"
      >
        <motion.div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#333] bg-[#252525] text-xs font-semibold text-white"
          animate={
            reducedMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 0 0 0 rgba(255,255,255,0)',
                    '0 0 0 4px rgba(255,255,255,0.04)',
                    '0 0 0 0 rgba(255,255,255,0)',
                  ],
                }
          }
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          ND
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">Admin</p>
          <p className="truncate text-xs text-white/45">admin@arielaram.com</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
