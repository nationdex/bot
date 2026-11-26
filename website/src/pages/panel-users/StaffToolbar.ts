type StaffTab = 'users' | 'groups';

export interface StaffToolbarState {
  tab: StaffTab;
  query: string;
  users: number;
  groups: number;
  onTab: (tab: StaffTab) => void;
  onSearch: (query: string) => void;
  onAdd: () => void;
}

const template = document.createElement('template');
template.innerHTML = `
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-xl font-bold text-[var(--admin-fg)] sm:text-2xl">Staff &amp; Access Management</h1>
      <p class="text-xs text-[var(--admin-muted)] sm:text-sm">Manage admin panel users, assigned divisions, and granular system permissions.</p>
    </div>
    <div class="flex items-center gap-2">
      <button data-add type="button" class="items-center justify-center whitespace-nowrap rounded-md disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity flex gap-2 text-xs font-medium"><span></span></button>
    </div>
  </div>
  <div class="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
    <div class="relative w-full sm:w-72">
      <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
      <input type="text" class="flex w-full border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 h-9 pl-9 rounded-lg bg-[var(--admin-card)] text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] shadow-none focus-visible:ring-1 focus-visible:ring-[var(--admin-accent)]">
    </div>
    <div class="flex items-center gap-2 p-1 rounded-full bg-[var(--admin-card)] w-fit self-start sm:self-auto">
      ${tab('users', 'Users')}
      ${tab('groups', 'FolderGit2')}
    </div>
  </div>
`;

function tab(id: StaffTab, icon: string) {
  return `<button data-tab="${id}" type="button" class="relative px-4 py-2 text-xs font-medium rounded-full transition-colors flex items-center gap-2">
    <span data-active class="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"></span>
    <span class="relative z-10 flex items-center gap-2">${svg(icon)}<span data-label></span></span>
  </button>`;
}

function svg(name: string) {
  const paths: Record<string, string> = {
    Users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle>',
    FolderGit2:
      '<path d="M18 19a5 5 0 0 1-5-5v8"></path><path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5"></path><circle cx="13" cy="12" r="2"></circle><circle cx="20" cy="19" r="2"></circle>',
    Plus: '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
    UserPlus:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line>',
  };
  return `<svg class="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

export class StaffToolbar extends HTMLElement {
  private current?: StaffToolbarState;

  set state(state: StaffToolbarState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  connectedCallback() {
    this.style.display = 'contents';
    if (!this.hasChildNodes()) {
      this.append(template.content.cloneNode(true));
      this.querySelector('[data-add]')!.addEventListener('click', () => this.current?.onAdd());
      const input = this.querySelector('input')!;
      input.addEventListener('input', () => this.current?.onSearch(input.value));
      for (const button of this.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
        button.addEventListener('click', () => this.current?.onTab(button.dataset.tab as StaffTab));
      }
    }
    this.update();
  }

  private update() {
    const state = this.current;
    if (!state) return;
    const users = state.tab === 'users';
    const add = this.querySelector<HTMLButtonElement>('[data-add]')!;
    const label = add.querySelector('span')!;
    const action = users ? 'Add User' : 'Create Group';
    if (label.textContent !== action) {
      add.querySelector('svg')?.remove();
      label.insertAdjacentHTML('beforebegin', svg(users ? 'UserPlus' : 'Plus'));
      label.textContent = action;
    }
    const input = this.querySelector('input')!;
    input.placeholder = users ? 'Search staff accounts...' : 'Search groups & divisions...';
    input.setAttribute('aria-label', users ? 'Search staff accounts' : 'Search groups and divisions');
    if (input.value !== state.query) input.value = state.query;
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
      const userTab = button.dataset.tab === 'users';
      const active = userTab === users;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector<HTMLElement>('[data-active]')!.hidden = !active;
      button.classList.toggle('text-[var(--admin-accent-fg)]', active);
      button.classList.toggle('text-[var(--admin-muted)]', !active);
      button.classList.toggle('hover:text-[var(--admin-fg)]', !active);
      button.querySelector('[data-label]')!.textContent = userTab
        ? `Users (${state.users})`
        : `Groups & Divisions (${state.groups})`;
    }
  }
}

customElements.define('pnd-staff-toolbar', StaffToolbar);
