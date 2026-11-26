import { fetchUserData, getCache, type UserEntry } from '@/lib/api';
import { collectibleLabel } from '@/lib/bot';
import { loadAnimationPrefs } from '@/lib/animation-prefs';

const layout = document.createElement('template');
layout.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6">
<div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
<div class="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
<div class="relative w-full sm:w-64">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]">
<path d="m21 21-4.34-4.34">
</path>
<circle cx="11" cy="11" r="8">
</circle>
</svg>
<input aria-label="Search by Discord ID" placeholder="Search by Discord ID..." class="flex h-10 w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 pl-9 bg-[var(--admin-elevated)] border-[var(--admin-border)] text-[var(--admin-fg)]">
</div>
<div class="relative flex w-full items-center h-9 w-full sm:w-32 text-xs rounded-lg text-[var(--admin-fg)] border-0 shadow-none bg-[var(--admin-elevated)] border-[var(--admin-border)]">
<select aria-label="Inventory privacy" class="h-full w-full cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none disabled:cursor-not-allowed disabled:opacity-50" style="color-scheme: dark;">
<option value="all">All Privacy</option>
<option value="public">Public</option>
<option value="private">Private</option>
</select>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="pointer-events-none absolute right-3 h-4 w-4 opacity-50">
<path d="m6 9 6 6 6-6">
</path>
</svg>
</div>
<div class="relative flex w-full items-center h-9 w-full sm:w-28 text-xs rounded-lg text-[var(--admin-fg)] border-0 shadow-none bg-[var(--admin-elevated)] border-[var(--admin-border)]">
<select aria-label="Accept gifts" class="h-full w-full cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none disabled:cursor-not-allowed disabled:opacity-50" style="color-scheme: dark;">
<option value="all">All Gifts</option>
<option value="yes">Yes</option>
<option value="no">No</option>
</select>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="pointer-events-none absolute right-3 h-4 w-4 opacity-50">
<path d="m6 9 6 6 6-6">
</path>
</svg>
</div>
</div>
</div>
<div class="bg-[var(--admin-card)] overflow-x-auto rounded-xl bg-[var(--admin-card)] border-[var(--admin-border)]">
<div class="p-0">
<div>
<table class="w-full min-w-[640px]">
<thead>
<tr class="border-b border-[var(--admin-border)]">
<th class="py-4 pl-5 sm:pl-6 pr-4 text-left text-xs text-[var(--admin-muted)]">Discord ID</th>
<th class="py-4 px-4 text-left text-xs text-[var(--admin-muted)]">Total</th>
<th class="py-4 px-4 text-left text-xs text-[var(--admin-muted)]">Unique</th>
<th class="py-4 px-4 text-left text-xs text-[var(--admin-muted)]">Value</th>
<th class="py-4 px-4 text-left text-xs text-[var(--admin-muted)]">Privacy</th>
<th class="py-4 px-4 text-left text-xs text-[var(--admin-muted)]">Gifts</th>
<th class="py-4 pr-5 sm:pr-6 text-right text-xs text-[var(--admin-muted)]">Actions</th>
</tr>
</thead>
<tbody>
</tbody>
</table>
</div>
<p data-empty hidden class="py-8 text-center text-sm text-[var(--admin-muted)]">No users found.</p>
<div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs text-[var(--admin-muted)]">
<div class="flex items-center gap-4 flex-wrap">
<div class="flex items-center gap-2">
<span>Rows per page:</span>
<select name="pagesize" class="bg-[var(--admin-elevated)] text-[var(--admin-fg)] rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none cursor-pointer">
<option value="5">5</option>
<option value="10">10</option>
<option value="25">25</option>
<option value="50">50</option>
</select>
</div>
<span>Showing <strong class="text-[var(--admin-fg)] font-semibold" data-range>
</strong> of <strong class="text-[var(--admin-fg)] font-semibold" data-total>
</strong> entries</span>
</div>
<div class="flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)]">
<button type="button" title="First Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m11 17-5-5 5-5">
</path>
<path d="m18 17-5-5 5-5">
</path>
</svg>
</button>
<button type="button" title="Previous Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m15 18-6-6 6-6">
</path>
</svg>
</button>
<span class="px-2.5 text-xs font-semibold text-[var(--admin-fg)] select-none" data-page>
</span>
<button type="button" title="Next Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m9 18 6-6-6-6">
</path>
</svg>
</button>
<button type="button" title="Last Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m6 17 5-5-5-5">
</path>
<path d="m13 17 5-5-5-5">
</path>
</svg>
</button>
</div>
</div>
</div>
</div>
</div>
`;

const rowTemplate = document.createElement('template');
rowTemplate.innerHTML = `
<tr class="border-b border-[var(--admin-border)] last:border-0 transition-colors hover:bg-[color-mix(in_srgb,var(--admin-fg)_5%,transparent)]">
<td class="py-3 pl-5 sm:pl-6 pr-4 text-sm font-medium text-[var(--admin-fg)]">
<button type="button" class="hover:underline text-left cursor-pointer">
</button>
</td>
<td class="py-3 px-4 text-sm text-[var(--admin-fg)]">
</td>
<td class="py-3 px-4 text-sm text-[var(--admin-fg)]">
</td>
<td class="py-3 px-4 text-sm text-[var(--admin-fg)]">
</td>
<td class="py-3 px-4 text-sm capitalize text-[var(--admin-muted)]">
</td>
<td class="py-3 px-4 text-sm text-[var(--admin-muted)]">
</td>
<td class="py-3 pr-5 sm:pr-6 text-right">
<button type="button" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-3 text-[var(--admin-muted)] hover:text-[var(--admin-fg)] cursor-pointer">
</button>
</td>
</tr>
`;

const loadEditor = () => import('./PlayerEditor');

export class UsersPage extends HTMLElement {
  searchQuery = '';
  private privacy = 'all';
  private gifts = 'all';
  private size = 10;
  private page = 1;
  private users = getCache<UserEntry[]>('users_all') ?? [];
  private loading = !this.users.length;
  private generation = 0;
  private editorCleanup?: () => void;

  connectedCallback() {
    const generation = ++this.generation;
    this.style.display = 'contents';
    this.showList();
    void fetchUserData()
      .then((users) => {
        if (generation !== this.generation) return;
        if (users) this.users = users;
      })
      .catch(() => {
        // Retain available rows when refreshing fails.
      })
      .finally(() => {
        if (generation !== this.generation) return;
        this.loading = false;
        this.renderRows();
      });
  }

  disconnectedCallback() {
    ++this.generation;
    this.editorCleanup?.();
  }

  private showList() {
    this.editorCleanup?.();
    this.editorCleanup = undefined;
    this.replaceChildren(layout.content.cloneNode(true));
    const search = this.querySelector('input')!;
    const [privacy, gifts, pageSize] = this.querySelectorAll('select');
    search.value = this.searchQuery;
    privacy.value = this.privacy;
    gifts.value = this.gifts;
    pageSize.value = String(this.size);
    pageSize.setAttribute('aria-label', 'Rows per page');
    const reset = () => {
      this.page = 1;
      this.renderRows();
    };
    search.addEventListener('input', () => {
      this.searchQuery = search.value;
      reset();
    });
    privacy.addEventListener('change', () => {
      this.privacy = privacy.value;
      reset();
    });
    gifts.addEventListener('change', () => {
      this.gifts = gifts.value;
      reset();
    });
    pageSize.addEventListener('change', () => {
      this.size = Number(pageSize.value);
      reset();
    });
    const actions = [
      ['First Page', (n: number) => Math.min(1, n)],
      ['Previous Page', () => this.page - 1],
      ['Next Page', () => this.page + 1],
      ['Last Page', (n: number) => n],
    ] as const;
    for (const [label, target] of actions) {
      this.querySelector(`button[title="${label}"]`)!.addEventListener('click', () => {
        this.page = target(this.pageCount);
        this.renderRows();
      });
    }
    this.renderRows();
  }

  private pageCount = 1;

  private renderRows() {
    const body = this.querySelector('tbody');
    if (!body) return;
    const matches = this.users.filter(
      (user) =>
        /^\d{15,22}$/.test(user.discordId) &&
        user.discordId.includes(this.searchQuery) &&
        (this.privacy === 'all' || user.inventoryPrivacy?.toLowerCase() === this.privacy) &&
        (this.gifts === 'all' || Boolean(user.acceptGifts) === (this.gifts === 'yes')),
    );
    this.pageCount = Math.max(1, Math.ceil(matches.length / this.size));
    this.page = Math.max(1, Math.min(this.page, this.pageCount));
    const start = (this.page - 1) * this.size;
    body.replaceChildren();
    if (this.loading) {
      for (let i = 0; i < 8; i++) {
        const row = rowTemplate.content.firstElementChild!.cloneNode(true) as HTMLTableRowElement;
        row.className = 'border-b border-[var(--admin-border)] last:border-0';
        ['w-36', 'w-16', 'w-10', 'w-12', 'w-14', 'w-10', 'w-14'].forEach((width, index) => {
          const placeholder = document.createElement('pnd-skeleton');
          placeholder.className = (index === 6 ? 'h-7 rounded-lg ml-auto ' : 'h-4 ') + width;
          if (index === 6) placeholder.dataset.customRadius = '';
          row.cells[index].replaceChildren(placeholder);
        });
        body.append(row);
      }
    } else {
      const prefs = loadAnimationPrefs();
      const reveal = prefs.masterEnabled && prefs.listReveal && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      matches.slice(start, start + this.size).forEach((user, index) => {
        const row = rowTemplate.content.firstElementChild!.cloneNode(true) as HTMLTableRowElement;
        const [id, edit] = row.querySelectorAll('button');
        id.textContent = user.discordId;
        edit.textContent = 'Edit';
        for (const button of [id, edit]) {
          const preload = () => void loadEditor().catch(() => {});
          button.addEventListener('pointerenter', preload, { once: true });
          button.addEventListener('focus', preload, { once: true });
          button.addEventListener('click', () => void this.openEditor(user.discordId));
        }
        const total = reveal ? `${user.total} ${collectibleLabel(user.total)}` : String(user.total);
        [total, user.unique, user.totalValue, user.inventoryPrivacy, user.acceptGifts ? 'Yes' : 'No'].forEach(
          (value, column) => {
            row.cells[column + 1].textContent = String(value ?? '');
          },
        );
        body.append(row);
        if (reveal)
          row.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: index * 20, fill: 'backwards' });
      });
    }
    this.querySelector<HTMLElement>('[data-empty]')!.hidden = this.loading || matches.length > 0;
    this.querySelector('[data-range]')!.textContent =
      `${matches.length ? start + 1 : 0}–${Math.min(start + this.size, matches.length)}`;
    this.querySelector('[data-total]')!.textContent = String(matches.length);
    this.querySelector('[data-page]')!.textContent = `Page ${this.page} of ${this.pageCount}`;
    for (const title of ['First Page', 'Previous Page', 'Next Page', 'Last Page']) {
      this.querySelector<HTMLButtonElement>(`button[title="${title}"]`)!.disabled =
        title === 'First Page' || title === 'Previous Page' ? this.page === 1 : this.page === this.pageCount;
    }
  }

  private async openEditor(id: string) {
    const host = document.createElement('div');
    host.textContent = 'Loading…';
    this.replaceChildren(host);
    try {
      const { mountPlayerEditor } = await loadEditor();
      if (!host.isConnected) return;
      host.replaceChildren();
      this.editorCleanup = mountPlayerEditor(host, id, () => this.showList());
    } catch {
      if (!host.isConnected) return;
      const back = document.createElement('button');
      back.type = 'button';
      back.textContent = 'Back to Users';
      back.addEventListener('click', () => this.showList());
      host.replaceChildren('Could not load the player editor. ', back);
    }
  }
}

customElements.define('pnd-users', UsersPage);
