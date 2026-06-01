import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  Globe,
  Layers,
  LayoutDashboard,
  Menu,
  Settings as SettingsIcon,
  Users,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import HeaderSearch from '@/components/HeaderSearch';
import { SIDEBAR_WIDTH, Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemePrefs } from '@/hooks/useThemePrefs';
import { admin } from '@/lib/admin-classes';
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
import { cn } from '@/lib/utils';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  nations: bot.collectible.plural.charAt(0).toUpperCase() + bot.collectible.plural.slice(1),
  cards: 'Cards',
  settings: 'Settings',
};

const Dashboard = lazy(() => import('@/components/Dashboard'));
const UsersPage = lazy(() => import('@/components/Users'));
const Nations = lazy(() => import('@/components/Nations'));
const CardsPage = lazy(() => import('@/components/Cards'));
const Settings = lazy(() => import('@/components/Settings'));

export default function App() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectionFilterQuery, setSectionFilterQuery] = useState('');
  const { mode } = useThemePrefs();
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
      label: 'Cards',
      href: '#',
      icon: <Layers className="h-5 w-5" />,
      id: 'cards',
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
      case 'cards':
        return <CardsPage searchQuery={sectionFilterQuery} />;
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
          <p
            className={cn(
              'mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider',
              admin.muted
            )}
          >
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
    </>
  );

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <div className={cn('min-h-screen transition-colors duration-300', admin.shell)}>
        <Sidebar open={mobileOpen} setOpen={setMobileOpen}>
          <SidebarBody>{sidebarContent}</SidebarBody>
        </Sidebar>

        <div
          className="min-h-screen transition-[margin] duration-200 md:ml-[calc(var(--sidebar-width)+1rem)]"
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
              className={cn(
                'preserve-3d gpu-layer flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-2xl border md:min-h-[calc(100vh-2rem)]',
                admin.panel
              )}
            >
              <header
                className={cn(
                  'sticky top-0 z-40 border-b backdrop-blur-sm',
                  admin.panel,
                  'bg-[color-mix(in_srgb,var(--admin-panel)_95%,transparent)]'
                )}
              >
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSection}
                        {...headerTitleMotion}
                        style={enable3D ? { transformPerspective: 900 } : undefined}
                        className={enable3D ? 'preserve-3d' : undefined}
                      >
                        <h1 className={cn('truncate text-base font-semibold sm:text-lg', admin.fg)}>
                          {sectionTitles[currentSection] ?? 'Admin'}
                        </h1>
                        <p className={cn('truncate text-xs', admin.muted)}>
                          {bot.name} v{bot.version} · {mode} mode
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
                      className={cn(
                        'rounded-lg p-2 md:hidden transition-colors',
                        admin.muted,
                        admin.hoverRow
                      )}
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
                    <Suspense
                      fallback={
                        <div
                          className={cn(
                            'flex min-h-[240px] items-center justify-center rounded-lg border',
                            admin.elevated,
                            admin.muted
                          )}
                        >
                          Loading section...
                        </div>
                      }
                    >
                      {renderContent()}
                    </Suspense>
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
        src="/assets/logo.png"
        alt="Nationdex"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
        animate={reducedMotion || !enable3D ? undefined : { rotate: [0, -3, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="min-w-0">
        <span className={cn('block truncate text-base font-semibold', admin.fg)}>{bot.name}</span>
        <span className={cn('block truncate text-[10px]', admin.muted)}>Admin panel</span>
      </div>
    </motion.div>
  );
};
