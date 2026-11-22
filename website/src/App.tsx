import { AnimatePresence, m } from '@/lib/panel-motion';
import {
  Database,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Settings as SettingsIcon,
  Sliders,
  UserCheck,
  Users,
} from '@/components/icons';
import { lazy, Suspense } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import HeaderSearch from '@/components/layout/HeaderSearch';
import Login from '@/pages/login/Login';
import { SectionSkeleton } from '@/components/feedback/SectionSkeleton';
import { SIDEBAR_WIDTH, Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useIs3DEnabled, useMotionPref } from '@/hooks/useReducedMotion';
import { admin } from '@/lib/admin-classes';
import { fetchCollectibles, getCache, type CollectibleEntry } from '@/lib/api';
import { checkSession, isCookieless, logout, type PanelUser } from '@/lib/auth';
import { bot } from '@/lib/bot';
import { pageTransition, pageTransitionNone, perspectiveDefault } from '@/lib/motion';
import { cn } from '@/lib/utils';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  nations: bot.collectible.plural.charAt(0).toUpperCase() + bot.collectible.plural.slice(1),
  instances: 'Nation Instances',
  guilds: 'Guild Configs',
  cards: 'Cards',
  bot_settings: 'Settings',
  panel_users: 'Users',
  settings: 'Panel Settings',
};

const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const UsersPage = lazy(() => import('@/pages/players/Users'));
const Nations = lazy(() => import('@/pages/nations/Nations'));
const InstancesPage = lazy(() => import('@/pages/catches/Instances'));
const GuildsPage = lazy(() => import('@/pages/guilds/Guilds'));
const CardsPage = lazy(() => import('@/pages/cards/Cards'));
const BotSettingsPage = lazy(() => import('@/pages/settings/BotSettings'));
const PanelUsersPage = lazy(() => import('@/pages/panel-users/PanelUsers'));
const Settings = lazy(() => import('@/pages/settings/Settings'));

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<PanelUser | null>(null);
  const [nationsCount, setNationsCount] = useState<number | null>(() => {
    const cached = getCache<CollectibleEntry[]>('collectibles_all');
    return cached && Array.isArray(cached) ? cached.length : null;
  });

  const [unreachable, setUnreachable] = useState(false);

  const fetchSession = () => {
    checkSession()
      .then((res) => {
        setUnreachable(false);
        setAuthed(res.authenticated);
        if (res.user) setCurrentUser(res.user);
      })
      .catch(() => setUnreachable(true));
  };

  useEffect(() => {
    fetchSession();
    window.addEventListener('online', fetchSession);
    void fetchCollectibles().then((data) => {
      if (Array.isArray(data)) {
        setNationsCount(data.length);
      }
    });
    return () => window.removeEventListener('online', fetchSession);
  }, []);

  const [currentSection, setCurrentSection] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectionFilterQuery, setSectionFilterQuery] = useState('');
  const enable3D = useIs3DEnabled();
  const pageTransitions = useMotionPref('pageTransitions');
  const hoverFeedback = useMotionPref('hoverFeedback');

  const pageMotion = !pageTransitions ? pageTransitionNone : pageTransition;

  const headerTitleMotion = !pageTransitions
    ? pageTransitionNone
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      };

  const handleGlobalNavigate = (section: string, filterQuery?: string) => {
    setCurrentSection(section);
    setSectionFilterQuery(filterQuery ?? '');
    setMobileOpen(false);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    setCurrentSection(id);
    setSectionFilterQuery('');
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
    setCurrentUser(null);
  };

  const isAllowed = (perm: string, id: string) => {
    if (!currentUser) return true;
    if (currentUser.role === 'owner' || currentUser.permissions.includes('*')) return true;
    return currentUser.permissions.includes(perm) || id === 'dashboard';
  };

  const dashboardLink = {
    label: 'Dashboard',
    href: '#',
    icon: <LayoutDashboard className="h-5 w-5" />,
    id: 'dashboard',
    perm: 'view_dashboard',
  };

  const navCategories = [
    {
      title: bot.collectible.plural,
      links: [
        {
          label: 'Users',
          href: '#',
          icon: <Users className="h-5 w-5" />,
          id: 'users',
          perm: 'manage_users',
        },
        {
          label: sectionTitles.nations,
          href: '#',
          icon: <Globe className="h-5 w-5" />,
          id: 'nations',
          perm: 'manage_nations',
        },
        {
          label: 'Nation Instances',
          href: '#',
          icon: <Database className="h-5 w-5" />,
          id: 'instances',
          perm: 'manage_nations',
        },
        {
          label: 'Guild Configs',
          href: '#',
          icon: <Server className="h-5 w-5" />,
          id: 'guilds',
          perm: 'manage_servers',
        },
        {
          label: 'Cards',
          href: '#',
          icon: <Layers className="h-5 w-5" />,
          id: 'cards',
          perm: 'manage_cards',
        },
        {
          label: 'Settings',
          href: '#',
          icon: <SettingsIcon className="h-5 w-5" />,
          id: 'bot_settings',
          perm: 'manage_bot_settings',
        },
      ].filter((l) => isAllowed(l.perm, l.id)),
    },
    {
      title: 'Panel',
      links: [
        {
          label: 'Users',
          href: '#',
          icon: <UserCheck className="h-5 w-5" />,
          id: 'panel_users',
          perm: 'manage_panel_users',
        },
        {
          label: 'Settings',
          href: '#',
          icon: <Sliders className="h-5 w-5" />,
          id: 'settings',
          perm: 'manage_bot_settings',
        },
      ].filter((l) => isAllowed(l.perm, l.id)),
    },
  ].filter((cat) => cat.links.length > 0);

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard logSearchQuery={sectionFilterQuery} />;
      case 'users':
        return <UsersPage searchQuery={sectionFilterQuery} />;
      case 'nations':
        return <Nations searchQuery={sectionFilterQuery} onCountChange={setNationsCount} />;
      case 'instances':
        return <InstancesPage searchQuery={sectionFilterQuery} />;
      case 'guilds':
        return <GuildsPage searchQuery={sectionFilterQuery} />;
      case 'cards':
        return <CardsPage searchQuery={sectionFilterQuery} />;
      case 'bot_settings':
        return <BotSettingsPage />;
      case 'panel_users':
        return <PanelUsersPage currentUser={currentUser} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard logSearchQuery={sectionFilterQuery} />;
    }
  };

  if (unreachable && authed === null) {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center gap-3 p-6 text-center', admin.shell)}>
        <h1 className={cn('text-lg font-semibold', admin.fg)}>Can&apos;t reach the panel</h1>
        <p className={cn('max-w-sm text-sm', admin.muted)}>
          You are offline or the bot is not running. The panel reconnects by itself, or try again now.
        </p>
        <button
          type="button"
          onClick={fetchSession}
          className="cursor-pointer rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-[var(--admin-accent-fg)]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (authed === null) {
    return <div className={cn('h-full', admin.shell)} />;
  }

  if (!authed) {
    return (
      <Login
        onSuccess={(user) => {
          setAuthed(true);
          if (user) setCurrentUser(user);
          else fetchSession();
        }}
      />
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 pb-4 pt-5 md:pt-6">
        <Logo />

        <nav className="flex flex-col gap-5">
          {isAllowed(dashboardLink.perm, dashboardLink.id) && (
            <div className="flex flex-col gap-1">
              <div
                key={dashboardLink.id}
                onClick={(e) => handleLinkClick(e, dashboardLink.id)}
                className="cursor-pointer"
              >
                <SidebarLink link={dashboardLink} active={currentSection === dashboardLink.id} />
              </div>
            </div>
          )}

          {navCategories.map((cat) => (
            <div key={cat.title} className="flex flex-col gap-1">
              <p className={cn('mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider', admin.muted)}>
                {cat.title}
              </p>
              <div className="flex flex-col gap-1">
                {cat.links.map((link) => (
                  <div key={link.id} onClick={(e) => handleLinkClick(e, link.id)} className="cursor-pointer">
                    <SidebarLink link={link} active={currentSection === link.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {currentUser && (
        <div className="p-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-[var(--admin-card)] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--admin-fg)] truncate">
                {currentUser.displayName || currentUser.username}
              </p>
              <div className="flex items-center gap-1">
                {currentUser.role === 'owner' ? (
                  <span className="text-[10px] font-bold text-amber-400">Owner</span>
                ) : currentUser.groupName ? (
                  <span
                    className="text-[10px] font-medium truncate"
                    style={{ color: currentUser.groupColor ?? '#a855f7' }}
                  >
                    {currentUser.groupName}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--admin-muted)] capitalize">{currentUser.role}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[var(--admin-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('h-full overflow-hidden transition-colors duration-300', admin.shell)}>
      <Sidebar open={mobileOpen} setOpen={setMobileOpen}>
        <SidebarBody className="flex flex-col justify-between">{sidebarContent}</SidebarBody>
      </Sidebar>

      <div
        className="h-full transition-[margin] duration-200 md:ml-[calc(var(--sidebar-width)+1rem)]"
        style={{ ['--sidebar-width' as string]: `${SIDEBAR_WIDTH}px` }}
      >
        <div className="h-full p-3 md:p-4 perspective-scene">
          {isCookieless() && (
            <p
              role="status"
              className={cn('mb-2 rounded-lg px-3 py-1.5 text-center text-xs', admin.elevated, admin.muted)}
            >
              Signed in without cookies: this session ends when you reload or close the tab.
            </p>
          )}
          <m.main
            initial={!pageTransitions ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={!pageTransitions ? { duration: 0 } : { duration: 0.2 }}
            style={enable3D ? { transformPerspective: perspectiveDefault } : undefined}
            className={cn(
              'preserve-3d gpu-layer flex h-full min-h-0 flex-col overflow-hidden rounded-2xl',
              admin.panel,
            )}
          >
            <header
              className={cn(
                'shrink-0 z-40 border-b backdrop-blur-sm',
                'border-[var(--admin-border)]',
                'bg-[color-mix(in_srgb,var(--admin-panel)_95%,transparent)]',
              )}
            >
              <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  {pageTransitions ? (
                    <AnimatePresence mode="wait">
                      <m.div
                        key={currentSection}
                        {...headerTitleMotion}
                        style={enable3D ? { transformPerspective: 900 } : undefined}
                        className={cn('flex items-center gap-2.5', enable3D && 'preserve-3d')}
                      >
                        <h1 className={cn('truncate text-base font-semibold sm:text-lg', admin.fg)}>
                          {sectionTitles[currentSection] ?? 'Admin'}
                        </h1>
                        {currentSection === 'nations' && nationsCount !== null && (
                          <span className="text-[var(--admin-muted)]">({nationsCount})</span>
                        )}
                      </m.div>
                    </AnimatePresence>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <h1 className={cn('truncate text-base font-semibold sm:text-lg', admin.fg)}>
                        {sectionTitles[currentSection] ?? 'Admin'}
                      </h1>
                      {currentSection === 'nations' && nationsCount !== null && (
                        <span className="text-[var(--admin-muted)]">({nationsCount})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <HeaderSearch onNavigate={handleGlobalNavigate} />

                  <m.button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    whileHover={hoverFeedback ? { scale: 1.05 } : undefined}
                    whileTap={hoverFeedback ? { scale: 0.92 } : undefined}
                    className={cn('rounded-lg p-2 md:hidden transition-colors', admin.muted, admin.hoverRow)}
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </m.button>
                </div>
              </div>
            </header>

            <div data-admin-scroll className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
              {pageTransitions ? (
                <AnimatePresence mode="wait">
                  <m.div key={currentSection} {...pageMotion} className="preserve-3d gpu-layer w-full min-h-0">
                    <Suspense fallback={<SectionSkeleton section={currentSection} />}>{renderContent()}</Suspense>
                  </m.div>
                </AnimatePresence>
              ) : (
                <div className="w-full min-h-0">
                  <Suspense fallback={<SectionSkeleton section={currentSection} />}>{renderContent()}</Suspense>
                </div>
              )}
            </div>
          </m.main>
        </div>
      </div>
    </div>
  );
}

const Logo = () => {
  const enable3D = useIs3DEnabled();

  return (
    <div
      role="img"
      aria-label={`${bot.name} logo`}
      style={enable3D ? { perspective: 800 } : undefined}
      className="preserve-3d flex items-center gap-3 rounded-lg px-2 py-1.5"
    >
      <img src="/logo.png" alt="Nationdex" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
      <div className="min-w-0">
        <span className={cn('block truncate text-base font-semibold', admin.fg)}>{bot.name}</span>
        <span className={cn('block truncate text-[10px]', admin.muted)}>Admin panel</span>
      </div>
    </div>
  );
};
