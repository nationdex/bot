import { StaffToolbar } from './StaffToolbar';
import { PanelConfirm } from '@/components/feedback/PanelConfirm';
import { PanelUnsavedChanges } from '@/components/feedback/PanelUnsavedChanges';
import {
  createPanelGroup,
  createPanelUser,
  deletePanelGroup,
  deletePanelUser,
  fetchPanelGroups,
  fetchPanelUsers,
  transferPanelOwnership,
  updatePanelGroup,
  updatePanelUser,
  type PanelGroup,
  type PanelUser,
} from '@/lib/auth';

const availablePermissions: Array<{ key: string; label: string; description: string }> = [
  {
    key: '*',
    label: 'Full Access (*)',
    description: 'Unrestricted control over all panel features and administrative settings',
  },
  { key: 'view_dashboard', label: 'View Dashboard', description: 'Access to statistics, metrics, and overview charts' },
  {
    key: 'manage_nations',
    label: 'Manage Nations',
    description: 'Create, edit, and manage nation collectibles and catalog',
  },
  {
    key: 'manage_users',
    label: 'Manage Bot Users',
    description: 'View player inventories, balances, and gift settings',
  },
  {
    key: 'manage_servers',
    label: 'Manage Servers',
    description: 'Manage guild spawn configs and active server settings',
  },
  { key: 'manage_cards', label: 'Manage Cards', description: 'Upload and configure regime and special card art' },
  {
    key: 'manage_bot_settings',
    label: 'Manage Bot Settings',
    description: 'Configure system parameters and rarity thresholds',
  },
  {
    key: 'manage_panel_users',
    label: 'Manage Panel Users',
    description: 'Create, edit, and delete staff accounts and passwords',
  },
  {
    key: 'manage_groups',
    label: 'Manage Groups & Roles',
    description: 'Create and divide staff groups and permission roles',
  },
];

const presetColors = [
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];

const muted = 'text-[var(--admin-muted)]';
const buttonStyle =
  'inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--admin-elevated)] disabled:opacity-50';
const fieldStyle =
  'w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-elevated)] px-3 py-2 text-sm text-[var(--admin-fg)]';
const card = 'bg-[var(--admin-card)] rounded-xl border border-[var(--admin-border)]';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, classes = '', text?: string) {
  const element = document.createElement(tag);
  if (classes) element.className = classes;
  if (text !== undefined) element.textContent = text;
  return element;
}

function button(text: string, run: () => void, classes = '') {
  const element = node('button', buttonStyle + ' ' + classes, text);
  element.type = 'button';
  element.addEventListener('click', run);
  return element;
}

export class PanelUsersPage extends HTMLElement {
  currentUser: PanelUser | null = null;
  private users: PanelUser[] = [];
  private groups: PanelGroup[] = [];
  private tab: 'users' | 'groups' = 'users';
  private queries = { users: '', groups: '' };
  private page = 1;
  private size = 10;
  private loading = true;
  private loadError = '';
  private generation = 0;
  private readonly toolbar = new StaffToolbar();
  private readonly content = node('div');
  private readonly confirm = new PanelConfirm();
  private readonly unsaved = new PanelUnsavedChanges();

  connectedCallback() {
    this.style.display = 'block';
    this.className = 'w-full space-y-6';
    this.replaceChildren(this.toolbar, this.content, this.confirm, this.unsaved);
    this.list();
    void this.load();
  }

  disconnectedCallback() {
    ++this.generation;
  }

  private async load() {
    const generation = ++this.generation;
    const [users, groups] = await Promise.allSettled([fetchPanelUsers(), fetchPanelGroups()]);
    if (generation !== this.generation) return;
    if (users.status === 'fulfilled' && users.value) this.users = users.value.users;
    if (groups.status === 'fulfilled' && groups.value) this.groups = groups.value.groups;
    this.loading = false;
    this.loadError =
      users.status === 'rejected' || groups.status === 'rejected' ? 'Some staff data could not be loaded.' : '';
    this.list();
  }

  private list() {
    this.unsaved.update({ show: false, onSave: () => {}, onReset: () => {} });
    this.toolbar.hidden = false;
    this.toolbar.state = {
      tab: this.tab,
      query: this.queries[this.tab],
      users: this.users.length,
      groups: this.groups.length,
      onTab: (tab) => {
        this.tab = tab;
        this.list();
      },
      onSearch: (query) => {
        this.queries[this.tab] = query;
        this.page = 1;
        this.renderList();
      },
      onAdd: () => this.edit(this.tab),
    };
    this.renderList();
  }

  private renderList() {
    this.content.replaceChildren();
    if (this.loading) {
      this.content.append(node('p', 'text-sm ' + muted, 'Loading staff accounts…'));
      return;
    }
    if (this.loadError) this.content.append(node('p', 'text-sm ' + muted, this.loadError));
    const query = this.queries[this.tab].toLowerCase().trim();
    if (this.tab === 'groups') {
      const grid = node('div', 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4');
      for (const group of this.groups.filter((entry) =>
        [entry.name, entry.description, ...entry.permissions].some((value) => value.toLowerCase().includes(query)),
      )) {
        const item = node('article', card + ' overflow-hidden');
        const body = node('div', 'p-5 space-y-3');
        const header = node('div', 'flex items-center justify-between gap-2');
        const name = node('h3', 'text-base font-semibold truncate', group.name);
        const dot = node('span', 'inline-block h-2 w-2 rounded-full mr-2');
        dot.style.backgroundColor = group.color;
        name.prepend(dot);
        header.append(
          name,
          node(
            'span',
            'text-xs px-2.5 py-0.5 rounded-full bg-[var(--admin-elevated)] ' + muted,
            `${group.memberCount} ${group.memberCount === 1 ? 'member' : 'members'}`,
          ),
        );
        const permissions = node('div', 'flex flex-wrap gap-1.5 pt-1');
        const labels = group.permissions.includes('*') ? ['Full Access (*)'] : group.permissions.slice(0, 4);
        if (!group.permissions.includes('*') && group.permissions.length > 4)
          labels.push('+' + (group.permissions.length - 4));
        for (const label of labels)
          permissions.append(node('span', 'text-[10px] px-2 py-0.5 rounded bg-[var(--admin-elevated)]', label));
        body.append(
          header,
          node('p', 'text-xs line-clamp-2 ' + muted, group.description || 'No description provided for this division.'),
          permissions,
        );
        const footer = node(
          'div',
          'flex items-center justify-between border-t border-[var(--admin-border)] px-5 py-2.5',
        );
        footer.append(
          button('Edit Group', () => this.edit('groups', group)),
          button('Delete', () => this.removeEntry('groups', group), 'text-rose-400'),
        );
        item.append(body, footer);
        grid.append(item);
      }
      this.content.append(
        grid.childElementCount ? grid : node('p', 'py-8 text-center text-sm ' + muted, 'No groups found.'),
      );
      return;
    }
    const results = this.users.filter((user) =>
      [user.username, user.displayName].some((value) => value.toLowerCase().includes(query)),
    );
    const pages = Math.max(1, Math.ceil(results.length / this.size));
    this.page = Math.min(this.page, pages);
    const panel = node('div', card + ' overflow-hidden');
    const scroll = node('div', 'overflow-x-auto w-full');
    const table = node('table', 'w-full min-w-[640px]');
    const headers = table.createTHead().insertRow();
    headers.className = 'border-b border-[var(--admin-border)]';
    for (const label of ['User', 'Role', 'Division', 'Permissions', 'Actions']) {
      const header = node('th', 'py-3.5 px-4 text-left text-xs font-semibold ' + muted, label);
      header.scope = 'col';
      headers.append(header);
    }
    const body = table.createTBody();
    const start = (this.page - 1) * this.size;
    for (const user of results.slice(start, start + this.size)) {
      const row = body.insertRow();
      row.className = 'border-b border-[var(--admin-border)] last:border-0';
      const name = row.insertCell();
      name.className = 'py-3.5 pl-5 sm:pl-6 pr-4';
      name.append(
        node('div', 'text-sm font-semibold', user.displayName || user.username),
        node('span', 'text-xs ' + muted, '@' + user.username),
      );
      const role = row.insertCell();
      role.className =
        'py-3.5 px-4 text-xs font-semibold capitalize ' +
        (user.role === 'owner' ? 'text-amber-400' : user.role === 'admin' ? 'text-purple-400' : muted);
      role.textContent = user.role;
      const division = row.insertCell();
      division.className = 'py-3.5 px-4 text-xs ' + muted;
      const badge = node('span', 'inline-flex rounded-full px-2.5 py-1', user.groupName || 'Unassigned');
      if (user.groupColor) {
        badge.style.color = user.groupColor;
        badge.style.backgroundColor = user.groupColor + '20';
      }
      division.append(badge);
      const permission = row.insertCell();
      permission.className = 'py-3.5 px-4 text-xs';
      permission.append(
        node(
          'span',
          'px-2 py-0.5 rounded bg-[var(--admin-elevated)]',
          user.permissions.includes('*')
            ? 'Full Access (*)'
            : `${user.permissions.length} ${user.permissions.length === 1 ? 'permission' : 'permissions'}`,
        ),
      );
      const actions = row.insertCell();
      actions.className = 'py-3.5 pr-5 sm:pr-6 text-right';
      const controls = node('div', 'flex items-center justify-end gap-1');
      controls.append(button('Edit', () => this.edit('users', user)));
      if (this.canTransfer(user))
        controls.append(button('Transfer Ownership', () => this.transfer(user), 'text-amber-400'));
      if (this.canDelete(user))
        controls.append(button('Delete', () => this.removeEntry('users', user), 'text-rose-400'));
      actions.append(controls);
    }
    scroll.append(table);
    panel.append(scroll);
    if (!results.length) panel.append(node('p', 'py-8 text-center text-sm ' + muted, 'No staff accounts found.'));
    panel.append(this.pagination(results.length, pages, start));
    this.content.append(panel);
  }

  private pagination(total: number, pages: number, start: number) {
    const container = node(
      'div',
      'flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs ' +
        muted,
    );
    const summary = node('div', 'flex items-center gap-4 flex-wrap');
    const label = node('label', 'flex items-center gap-2', 'Rows per page:');
    const select = node('select', 'bg-[var(--admin-elevated)] rounded-lg px-2.5 py-1 text-xs font-medium');
    for (const count of [5, 10, 25, 50]) select.add(new Option(String(count)));
    select.value = String(this.size);
    select.addEventListener('change', () => {
      this.size = Number(select.value);
      this.page = 1;
      this.renderList();
    });
    label.append(select);
    summary.append(
      label,
      node('span', '', `Showing ${total ? start + 1 : 0}–${Math.min(start + this.size, total)} of ${total} entries`),
    );
    const controls = node('div', 'flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)]');
    const jump = (glyph: string, title: string, target: number, disabled: boolean) => {
      const control = button(glyph, () => {
        this.page = target;
        this.renderList();
      });
      control.title = title;
      control.setAttribute('aria-label', title);
      control.disabled = disabled;
      return control;
    };
    controls.append(
      jump('«', 'First Page', 1, this.page === 1),
      jump('‹', 'Previous Page', this.page - 1, this.page === 1),
      node('span', 'px-2.5 text-xs font-semibold', `Page ${this.page} of ${pages}`),
      jump('›', 'Next Page', this.page + 1, this.page === pages),
      jump('»', 'Last Page', pages, this.page === pages),
    );
    container.append(summary, controls);
    return container;
  }

  private canTransfer(user: PanelUser) {
    return this.currentUser?.role === 'owner' && user.role !== 'owner';
  }

  private canDelete(user: PanelUser) {
    return user.id !== this.currentUser?.id && user.role !== 'owner';
  }

  private edit(kind: 'users' | 'groups', entry?: PanelUser | PanelGroup) {
    const user = kind === 'users' ? (entry as PanelUser | undefined) : undefined;
    const group = kind === 'groups' ? (entry as PanelGroup | undefined) : undefined;
    const isUser = kind === 'users';
    const originalPermissions = [...(entry?.permissions ?? ['view_dashboard'])];
    let permissions = [...originalPermissions];
    let saving = false;
    this.toolbar.hidden = true;
    const wrapper = node('div', 'space-y-6');
    const header = node('div', 'flex flex-wrap items-center justify-between gap-3');
    const title = isUser ? (user ? 'Edit Staff Account' : 'Add Staff Account') : group ? 'Edit Group' : 'Create Group';
    header.append(node('h2', 'text-xl font-bold sm:text-2xl', title));
    const actions = node('div', 'flex items-center gap-2');
    const back = button(isUser ? 'Back to Users' : 'Back to Groups', () => this.list());
    actions.append(back);
    if (user && this.canTransfer(user))
      actions.append(button('Transfer Ownership', () => this.transfer(user), 'text-amber-400'));
    if (entry && (!user || this.canDelete(user)))
      actions.append(button('Delete', () => this.removeEntry(kind, entry), 'text-rose-400'));
    header.append(actions);
    const form = node('form', card + ' p-5 sm:p-6 space-y-5');
    const fields = node('div', 'grid gap-4 sm:grid-cols-2');
    const addField = (label: string, control: HTMLElement) => {
      const field = node('label', 'block space-y-1.5 text-xs font-medium ' + muted);
      field.append(node('span', 'block', label), control);
      fields.append(field);
    };
    const input = (label: string, value = '', type = 'text') => {
      const element = node('input', fieldStyle);
      element.type = type;
      element.value = value;
      addField(label, element);
      return element;
    };
    const name = input(isUser ? 'Username' : 'Group Name', user?.username ?? group?.name);
    name.required = true;
    const description = input(isUser ? 'Display Name' : 'Description', user?.displayName ?? group?.description);
    const password = isUser ? input(user ? 'New Password (optional)' : 'Password', '', 'password') : undefined;
    if (password) {
      password.required = !user;
      password.minLength = 4;
      password.autocomplete = 'new-password';
    }
    const role = node('select', fieldStyle);
    const division = node('select', fieldStyle);
    const initialRole = user?.role ?? 'member';
    const initialGroup = String(user ? (user.groupId ?? '') : (this.groups[0]?.id ?? ''));
    const initialColor = group?.color || '#a855f7';
    if (isUser) {
      role.add(new Option('Member', 'member'));
      role.add(new Option('Admin', 'admin'));
      if (this.currentUser?.role === 'owner' || initialRole === 'owner') role.add(new Option('Panel Owner', 'owner'));
      role.value = initialRole;
      role.disabled = initialRole === 'owner';
      division.add(new Option('Unassigned', ''));
      for (const group of this.groups) division.add(new Option(group.name, String(group.id)));
      division.value = initialGroup;
      addField('Panel Role', role);
      addField('Group / Division', division);
    }
    const color = isUser ? undefined : input('Group Color', initialColor, 'color');
    if (color) {
      const colors = node('div', 'flex items-center gap-2');
      for (const preset of presetColors) {
        const option = button(
          preset.name,
          () => {
            color.value = preset.value;
            sync();
          },
          'rounded-full',
        );
        option.style.color = preset.value;
        colors.append(option);
      }
      fields.append(colors);
    }
    const permissionsList = node('div', 'grid gap-2 sm:grid-cols-2');
    const checkboxes = new Map<string, HTMLInputElement>();
    for (const permission of availablePermissions) {
      const choice = node('label', 'flex items-start gap-3 rounded-lg bg-[var(--admin-elevated)] p-3');
      const checkbox = node('input', 'mt-1 h-4 w-4');
      checkbox.type = 'checkbox';
      checkbox.addEventListener('change', () => {
        if (permission.key === '*') permissions = checkbox.checked ? ['*'] : ['view_dashboard'];
        else {
          permissions = permissions.filter((value) => value !== '*' && value !== permission.key);
          if (checkbox.checked) permissions.push(permission.key);
        }
        sync();
      });
      checkboxes.set(permission.key, checkbox);
      const text = node('span');
      text.append(
        node('span', 'block text-xs font-semibold', permission.label),
        node('span', 'block text-xs ' + muted, permission.description),
      );
      choice.append(checkbox, text);
      permissionsList.append(choice);
    }
    const error = node('p', 'text-xs text-rose-400');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    const setError = (text: string) => {
      error.textContent = text;
      error.hidden = !text;
    };
    const snapshot = () =>
      JSON.stringify([
        name.value,
        description.value,
        password?.value,
        role.value,
        division.value,
        color?.value,
        [...permissions].sort(),
      ]);
    const initial = snapshot();
    const sync = () => {
      for (const [key, checkbox] of checkboxes) checkbox.checked = permissions.includes(key);
      this.unsaved.update({
        show: saving || snapshot() !== initial,
        isSaving: saving,
        onReset: reset,
        onSave: () => form.requestSubmit(),
      });
    };
    const reset = () => {
      name.value = user?.username ?? group?.name ?? '';
      description.value = user?.displayName ?? group?.description ?? '';
      if (password) password.value = '';
      if (isUser) {
        role.value = initialRole;
        division.value = initialGroup;
      }
      if (color) color.value = initialColor;
      permissions = [...originalPermissions];
      setError('');
      sync();
    };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (saving) return;
      saving = true;
      setError('');
      const generation = this.generation;
      fieldset.disabled = true;
      back.disabled = true;
      sync();
      try {
        if (isUser) {
          const data = {
            username: name.value,
            displayName: description.value,
            password: password!.value,
            role: role.value as PanelUser['role'],
            groupId: division.value ? Number(division.value) : null,
            permissions,
          };
          const result = user
            ? await updatePanelUser(user.id, { ...data, password: data.password || undefined })
            : await createPanelUser(data);
          if (!result.ok) throw new Error(result.error ?? 'Could not save staff account.');
          if (generation !== this.generation) return;
          if (result.users) this.users = result.users;
        } else {
          const data = { name: name.value, description: description.value, color: color!.value, permissions };
          const result = group ? await updatePanelGroup(group.id, data) : await createPanelGroup(data);
          if (!result.ok) throw new Error(result.error ?? 'Could not save group.');
          if (generation !== this.generation) return;
          if (result.groups) this.groups = result.groups;
        }
        this.list();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : 'Could not save changes.');
      } finally {
        saving = false;
        fieldset.disabled = false;
        back.disabled = false;
        if (form.isConnected) sync();
      }
    });
    const fieldset = node('fieldset', 'min-w-0 space-y-5 border-0 p-0');
    fieldset.append(fields, node('h3', 'text-sm font-semibold', 'Permissions'), permissionsList);
    form.append(fieldset, error);
    wrapper.append(header, form);
    this.content.replaceChildren(wrapper);
    sync();
  }

  private transfer(user: PanelUser) {
    if (!this.canTransfer(user)) return;
    this.confirmAction(
      'Transfer Panel Ownership',
      `Are you sure you want to make ${user.displayName || user.username} the new Owner of this admin panel? Your account will be assigned the Admin role.`,
      'Confirm Ownership Transfer',
      false,
      async () => {
        const result = await transferPanelOwnership(user.id);
        if (!result.ok) throw new Error(result.error ?? 'Could not transfer ownership.');
        location.reload();
      },
    );
  }

  private removeEntry(kind: 'users' | 'groups', entry: PanelUser | PanelGroup) {
    const user = kind === 'users' ? (entry as PanelUser) : undefined;
    if (user && !this.canDelete(user)) return;
    this.confirmAction(
      user ? 'Delete Staff Account?' : 'Delete Staff Group?',
      user
        ? `Are you sure you want to permanently remove staff account @${user.username}? This account will lose all access.`
        : `Delete "${(entry as PanelGroup).name}"? Members will lose this group assignment.`,
      user ? 'Delete Account' : 'Delete Group',
      true,
      async () => {
        if (user) {
          const result = await deletePanelUser(user.id);
          if (!result.ok) throw new Error(result.error ?? 'Could not delete staff account.');
          if (result.users) this.users = result.users;
        } else {
          const result = await deletePanelGroup(entry.id);
          if (!result.ok) throw new Error(result.error ?? 'Could not delete group.');
          if (result.groups) this.groups = result.groups;
        }
        if (this.isConnected) await this.load();
      },
    );
  }

  private confirmAction(
    title: string,
    description: string,
    confirmText: string,
    isDanger: boolean,
    run: () => Promise<void>,
  ) {
    const state = {
      open: true,
      title,
      description,
      confirmText,
      isDanger,
      onClose: () => this.confirm.update({ ...state, open: false }),
      onConfirm: async () => {
        this.confirm.update({ ...state, isLoading: true });
        try {
          await run();
          if (this.isConnected) state.onClose();
        } catch (failure) {
          if (this.isConnected)
            this.confirm.update({
              ...state,
              description: failure instanceof Error ? failure.message : 'Request failed.',
            });
        }
      },
    };
    this.confirm.update(state);
  }
}

customElements.define('pnd-panel-users', PanelUsersPage);
