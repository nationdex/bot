import { panelMotionEnabled } from '@/lib/panel-animations';
import markup from './shell-template';
import '@/pages/login/Login';
import { GuildsPage } from '@/pages/guilds/Guilds';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { admin } from '@/lib/admin-classes';
import { checkSession, isCookieless, logout, type PanelUser } from '@/lib/auth';
import { fetchCollectibles } from '@/lib/api';

const sections = [
  ['dashboard', 'Dashboard', 'view_dashboard'],
  ['users', 'Users', 'manage_users'],
  ['nations', 'Nations', 'manage_nations'],
  ['instances', 'Nation Instances', 'manage_nations'],
  ['guilds', 'Guild Configs', 'manage_servers'],
  ['cards', 'Cards', 'manage_cards'],
  ['bot_settings', 'Settings', 'manage_bot_settings'],
  ['panel_users', 'Users', 'manage_panel_users'],
  ['settings', 'Panel Settings', 'manage_bot_settings'],
] as const;

export class PanelApp extends HTMLElement {
  private user: PanelUser | null = null;
  private section = 'dashboard';
  private generation = 0;
  private screenCleanup?: () => void;
  private searchCleanup?: () => void;
  private mobile?: HTMLElement;
  private count: number | null = null;

  connectedCallback() {
    this.style.display = 'block';
    this.style.height = '100%';
    window.addEventListener('online', this.session);
    void this.session();
    void fetchCollectibles().then((items) => {
      if (Array.isArray(items)) this.count = items.length;
      this.updateTitle();
    });
  }

  disconnectedCallback() {
    ++this.generation;
    window.removeEventListener('online', this.session);
    this.cleanup();
  }

  private cleanup() {
    this.screenCleanup?.();
    this.searchCleanup?.();
    this.mobile?.remove();
    this.mobile = undefined;
  }

  private readonly session = async () => {
    const generation = ++this.generation;
    try {
      const result = await checkSession();
      if (!this.isConnected || generation !== this.generation) return;
      if (
        result.authenticated &&
        this.querySelector('main') &&
        result.user?.id === this.user?.id &&
        result.user?.role === this.user?.role &&
        JSON.stringify(result.user?.permissions) === JSON.stringify(this.user?.permissions)
      ) {
        this.user = result.user ?? null;
        return;
      }
      this.cleanup();
      this.replaceChildren();
      this.user = result.user ?? null;
      if (result.authenticated) this.shell();
      else {
        const login = document.createElement('pnd-panel-login') as HTMLElement & {
          complete?: (user?: PanelUser) => void;
        };
        login.complete = (user) => {
          if (user) {
            this.user = user;
            this.replaceChildren();
            this.shell();
          } else void this.session();
        };
        this.append(login);
      }
    } catch {
      if (!this.isConnected || generation !== this.generation || this.querySelector('main')) return;
      this.replaceChildren();
      const message = document.createElement('div');
      message.className = 'flex h-full flex-col items-center justify-center gap-3 p-6 text-center ' + admin.shell;
      const title = document.createElement('h1');
      title.className = 'text-lg font-semibold ' + admin.fg;
      title.textContent = "Can't reach the panel";
      const description = document.createElement('p');
      description.className = 'max-w-sm text-sm ' + admin.muted;
      description.textContent =
        'You are offline or the bot is not running. The panel reconnects by itself, or try again now.';
      const retry = document.createElement('button');
      retry.className =
        'cursor-pointer rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-[var(--admin-accent-fg)]';
      retry.textContent = 'Try again';
      retry.addEventListener('click', this.session);
      message.append(title, description, retry);
      this.append(message);
    }
  };

  private allowed(id: string) {
    const entry = sections.find((item) => item[0] === id);
    return (
      !!entry &&
      (id === 'dashboard' ||
        this.user?.role === 'owner' ||
        this.user?.permissions.includes('*') ||
        this.user?.permissions.includes(entry[2]))
    );
  }

  private shell() {
    const template = document.createElement('template');
    template.innerHTML = markup;
    this.append(template.content.cloneNode(true));
    const sidebar = this.querySelector<HTMLElement>('[data-sidebar-desktop]')!;
    sidebar.style.width = '256px';
    sidebar.nextElementSibling?.nextElementSibling?.setAttribute('style', '--sidebar-width:256px');
    const links = sidebar.querySelectorAll<HTMLAnchorElement>('nav a');
    links.forEach((link, index) => {
      const [id] = sections[index];
      link.dataset.section = id;
      if (!this.allowed(id)) {
        link.parentElement!.remove();
        return;
      }
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.navigate(id);
      });
    });
    for (const paragraph of sidebar.querySelectorAll('p')) {
      if (paragraph.textContent === 'Owner')
        paragraph.textContent = this.user?.displayName || this.user?.username || '';
    }
    const profile = sidebar.querySelector('button[aria-label="Sign out"]')!.parentElement!;
    profile.querySelector('p')!.textContent = this.user?.displayName || this.user?.username || '';
    const badge = profile.querySelector('span')!;
    badge.textContent = this.user?.role === 'owner' ? 'Owner' : this.user?.groupName || this.user?.role || '';
    if (this.user?.role !== 'owner') badge.style.color = this.user?.groupColor || 'var(--admin-muted)';
    profile.querySelector('button')!.addEventListener('click', async () => {
      await logout();
      void this.session();
    });
    const search = this.querySelector('button[aria-label="Search admin panel"]')!;
    const host = document.createElement('div');
    host.style.display = 'contents';
    search.replaceWith(host);
    const searchElement = new HeaderSearch();
    searchElement.navigate = (section, query) => this.navigate(section, query);
    host.append(searchElement);
    this.searchCleanup = () => searchElement.remove();
    this.querySelector('button[aria-label="Open menu"]')!.addEventListener('click', () => this.openMobile());
    if (isCookieless()) {
      const note = document.createElement('p');
      note.className = 'mb-2 rounded-lg px-3 py-1.5 text-center text-xs ' + admin.elevated + ' ' + admin.muted;
      note.setAttribute('role', 'status');
      note.textContent = 'Signed in without cookies: this session ends when you reload or close the tab.';
      this.querySelector('main')!.before(note);
    }
    this.navigate(this.allowed(this.section) ? this.section : 'dashboard');
  }

  private openMobile() {
    this.mobile?.remove();
    const wrapper = document.createElement('div');
    wrapper.className = 'md:hidden';
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm';
    const sidebar = this.querySelector<HTMLElement>('[data-sidebar-desktop]')!.cloneNode(true) as HTMLElement;
    sidebar.removeAttribute('data-sidebar-desktop');
    sidebar.className = 'fixed inset-y-0 left-0 z-[100] flex w-64 flex-col ' + admin.sidebar;
    // Cloning copies markup only. Delegate clicks to the original bound controls.
    sidebar.addEventListener('click', (event) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-section],button');
      if (target?.dataset.section) this.navigate(target.dataset.section);
      else if (target?.getAttribute('aria-label') === 'Sign out')
        this.querySelector<HTMLButtonElement>('[data-sidebar-desktop] button')!.click();
    });
    backdrop.addEventListener('click', () => wrapper.remove());
    wrapper.append(backdrop, sidebar);
    this.append(wrapper);
    this.mobile = wrapper;
    if (panelMotionEnabled('pageTransitions')) {
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], 180);
      sidebar.animate([{ translate: '-100% 0' }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
    }
  }

  private updateTitle() {
    const title = this.querySelector('header h1');
    if (!title) return;
    title.textContent = sections.find((item) => item[0] === this.section)?.[1] || 'Dashboard';
    title.parentElement!.querySelector('[data-count]')?.remove();
    if (this.section === 'nations' && this.count !== null) {
      const count = document.createElement('span');
      count.dataset.count = '';
      count.className = admin.muted;
      count.textContent = '(' + this.count + ')';
      title.after(count);
    }
  }

  private navigate(section: string, query = '') {
    if (!this.allowed(section)) return;
    this.mobile?.remove();
    this.section = section;
    for (const link of this.querySelectorAll<HTMLElement>('[data-sidebar-desktop] [data-section]')) {
      const active = link.dataset.section === section;
      link.classList.toggle('text-[var(--admin-accent-fg)]', active);
      link.classList.toggle(admin.muted, !active);
      link.querySelector('.absolute')?.remove();
      if (active) {
        const background = document.createElement('span');
        background.className = 'absolute inset-0 rounded-lg bg-[var(--admin-accent)]';
        link.prepend(background);
        if (panelMotionEnabled('hoverFeedback')) background.animate([{ opacity: 0 }, { opacity: 1 }], 160);
      }
      const icon = link.querySelector<HTMLElement>('.relative')!;
      icon.classList.toggle('text-[var(--admin-accent-fg)]', active);
      icon.classList.toggle(admin.muted, !active);
    }
    this.updateTitle();
    const transitions = panelMotionEnabled('pageTransitions');
    if (transitions) this.querySelector('header h1')?.animate([{ opacity: 0 }, { opacity: 1 }], 150);
    const area = this.querySelector<HTMLElement>('[data-admin-scroll]')!;
    this.screenCleanup?.();
    const content = document.createElement('div');

    content.className = transitions ? 'preserve-3d gpu-layer w-full min-h-0' : 'w-full min-h-0';
    this.screenCleanup = undefined;
    area.replaceChildren(content);
    const mount = (screen: HTMLElement) => {
      content.replaceChildren(screen);
      if (transitions) content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    };
    if (section === 'guilds') {
      const guilds = new GuildsPage();
      mount(guilds);
      guilds.searchQuery = query;
      this.screenCleanup = () => guilds.remove();
      return;
    }
    if (section === 'users') {
      void import('@/pages/players/Users')
        .then(({ UsersPage }) => {
          if (!content.isConnected) return;
          const users = new UsersPage();
          users.searchQuery = query;
          mount(users);
          this.screenCleanup = () => users.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    if (section === 'nations') {
      void import('@/pages/nations/Nations')
        .then(({ NationsPage }) => {
          if (!content.isConnected) return;
          const nations = new NationsPage();
          nations.searchQuery = query;
          nations.onCountChange = (count) => {
            this.count = count;
            this.updateTitle();
          };
          mount(nations);
          this.screenCleanup = () => nations.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    if (section === 'panel_users') {
      void import('@/pages/panel-users/PanelUsers')
        .then(({ PanelUsersPage }) => {
          if (!content.isConnected) return;
          const users = new PanelUsersPage();
          users.currentUser = this.user;
          mount(users);
          this.screenCleanup = () => users.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    if (section === 'bot_settings') {
      void import('@/pages/settings/BotSettings')
        .then(({ BotSettingsPage }) => {
          if (!content.isConnected) return;
          const settings = new BotSettingsPage();
          mount(settings);
          this.screenCleanup = () => settings.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    if (section === 'settings') {
      void import('@/pages/settings/Settings')
        .then(({ PanelSettings }) => {
          if (!content.isConnected) return;
          const settings = new PanelSettings();
          settings.isOwner = this.user?.role === 'owner';
          mount(settings);
          this.screenCleanup = () => settings.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    if (section === 'cards') {
      void import('@/pages/cards/Cards')
        .then(({ CardsPage }) => {
          if (!content.isConnected) return;
          const cards = new CardsPage();
          cards.searchQuery = query;
          mount(cards);
          this.screenCleanup = () => cards.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    if (section === 'instances') {
      void import('@/pages/catches/Instances')
        .then(({ InstancesPage }) => {
          if (!content.isConnected) return;
          const instances = new InstancesPage();
          instances.searchQuery = query;
          mount(instances);
          this.screenCleanup = () => instances.remove();
        })
        .catch(() => {
          if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
        });
      return;
    }
    content.innerHTML = `
      <div class="space-y-6" role="status" aria-label="Loading dashboard">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${`<div class="p-5 rounded-2xl bg-[var(--admin-card)] space-y-3 ${admin.card}">
            <div class="flex items-center justify-between">
              <pnd-skeleton class="h-4 w-24"></pnd-skeleton>
              <pnd-skeleton data-custom-radius class="h-8 w-8 rounded-xl"></pnd-skeleton>
            </div>
            <pnd-skeleton class="h-8 w-20"></pnd-skeleton>
            <pnd-skeleton class="h-3 w-32 opacity-60"></pnd-skeleton>
          </div>`.repeat(4)}
        </div>
        <div class="p-6 rounded-2xl bg-[var(--admin-card)] space-y-4 ${admin.card}">
          <div class="flex items-center justify-between">
            <pnd-skeleton class="h-6 w-36"></pnd-skeleton>
            <pnd-skeleton data-custom-radius class="h-8 w-28 rounded-xl"></pnd-skeleton>
          </div>
          <pnd-skeleton data-custom-radius class="h-64 w-full rounded-xl"></pnd-skeleton>
        </div>
      </div>`;
    void import('@/pages/dashboard/Dashboard')
      .then(({ DashboardPage }) => {
        if (!content.isConnected) return;
        const dashboard = new DashboardPage();
        mount(dashboard);
        this.screenCleanup = () => dashboard.remove();
      })
      .catch(() => {
        if (content.isConnected) content.textContent = 'Could not load this screen. Select it again to retry.';
      });
  }
}

customElements.define('pnd-panel-app', PanelApp);
