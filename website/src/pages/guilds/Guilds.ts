import { revealPanelItems } from '@/lib/panel-animations';
import { admin } from '@/lib/admin-classes';
import { fetchGuildConfigs, getCache, type GuildConfigEntry } from '@/lib/api';

const template = document.createElement('template');
template.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
    <div class="relative w-full sm:w-64">
      <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${admin.muted}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
      <input aria-label="Search guild configs" class="flex h-10 w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 pl-9 ${admin.input}" placeholder="Search by Guild ID or Spawn Channel ID...">
    </div>
    <div class="relative flex items-center rounded-md border h-9 w-full sm:w-36 text-xs ${admin.input}"><select aria-label="Guild status" style="color-scheme:dark" class="h-full w-full cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none disabled:cursor-not-allowed disabled:opacity-50"><option value="all">All Status</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select><svg class="pointer-events-none absolute right-3 h-4 w-4 opacity-50" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></div>
  </div>
  <div class="bg-[var(--admin-card)] overflow-x-auto rounded-xl ${admin.card}">
    <div class="p-0">
      <div class="overflow-x-auto w-full">
        <table class="w-full min-w-[640px]">
          <thead><tr class="border-b border-[var(--admin-border)]">
            <th class="py-4 pl-5 sm:pl-6 pr-4 text-left text-xs font-semibold ${admin.muted}">Guild ID</th>
            <th class="py-4 px-4 text-left text-xs font-semibold ${admin.muted}">Spawn Channel</th>
            <th class="py-4 px-4 pr-5 sm:pr-6 text-left text-xs font-semibold ${admin.muted}">Enabled</th>
          </tr></thead><tbody></tbody>
        </table>
      </div>
      <p data-empty hidden class="py-8 text-center text-sm ${admin.muted}">No guild configs found.</p>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs text-[var(--admin-muted)]">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2"><span>Rows per page:</span>
            <select name="pagesize" aria-label="Rows per page" class="bg-[var(--admin-elevated)] text-[var(--admin-fg)] rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none cursor-pointer">
              <option>5</option><option selected>10</option><option>25</option><option>50</option>
            </select>
          </div>
          <span data-range></span>
        </div>
        <div data-pages class="flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)]"></div>
      </div>
    </div>
  </div>
</div>`;

const buttonClass =
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40';
const paths = ['m11 17-5-5 5-5 M18 17l-5-5 5-5', 'm15 18-6-6 6-6', 'm9 18 6-6-6-6', 'm6 17 5-5-5-5 M13 17l5-5-5-5'];

export class GuildsPage extends HTMLElement {
  private items = getCache<GuildConfigEntry[]>('guilds_all') || [];
  private loading = !this.items.length;
  private query = '';
  private status = 'all';
  private size = 10;
  private page = 1;
  private initialized = false;

  connectedCallback() {
    this.style.display = 'contents';
    if (this.initialized) return;
    this.initialized = true;
    this.append(template.content.cloneNode(true));
    this.querySelector('input')!.value = this.query;
    this.querySelector('input')!.addEventListener('input', (event) => {
      this.query = (event.target as HTMLInputElement).value;
      this.page = 1;
      this.update();
    });
    this.querySelector('select')!.addEventListener('change', (event) => {
      this.status = (event.target as HTMLSelectElement).value;
      this.page = 1;
      this.update();
    });
    this.querySelector('select[name="pagesize"]')!.addEventListener('change', (event) => {
      this.size = Number((event.target as HTMLSelectElement).value);
      this.page = 1;
      this.update();
    });
    this.update();
    void fetchGuildConfigs()
      .then((items) => {
        if (Array.isArray(items)) this.items = items;
      })
      .catch(() => {
        // Preserve the cached rows if refreshing fails.
      })
      .finally(() => {
        this.loading = false;
        if (this.isConnected) this.update();
      });
  }

  set searchQuery(query: string) {
    this.query = query;
    this.page = 1;
    const input = this.querySelector('input');
    if (input) input.value = query;
    if (this.initialized) this.update();
  }

  private update() {
    const query = this.query.toLowerCase();
    const filtered = this.items.filter(
      (item) =>
        [item.guildId, item.spawnChannel, item.id].some((value) => value.toLowerCase().includes(query)) &&
        (this.status === 'all' || item.enabled === (this.status === 'enabled')),
    );
    const pages = Math.max(1, Math.ceil(filtered.length / this.size));
    this.page = Math.min(this.page, pages);
    const rows = document.createDocumentFragment();
    if (this.loading) {
      for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        row.className = 'border-b border-[var(--admin-border)] last:border-0';
        row.innerHTML =
          '<td class="py-3 pl-5 sm:pl-6 pr-4"><pnd-skeleton class="h-4 w-40"></pnd-skeleton></td><td class="py-3 px-4"><pnd-skeleton class="h-4 w-32"></pnd-skeleton></td><td class="py-3 px-4 pr-5 sm:pr-6"><pnd-skeleton data-custom-radius class="h-5 w-16 rounded-full"></pnd-skeleton></td>';
        rows.append(row);
      }
    } else {
      for (const item of filtered.slice((this.page - 1) * this.size, this.page * this.size)) {
        const row = document.createElement('tr');
        row.className = 'border-b border-[var(--admin-border)] last:border-0 transition-colors ' + admin.hoverRow;
        [item.guildId, item.spawnChannel, item.enabled ? 'Enabled' : 'Disabled'].forEach((value, index) => {
          const cell = document.createElement('td');
          cell.className = [
            'py-3 pl-5 sm:pl-6 pr-4 text-sm font-medium ' + admin.fg,
            'py-3 px-4 text-sm ' + admin.fg,
            'py-3 px-4 pr-5 sm:pr-6 text-sm ' + admin.muted,
          ][index];
          cell.textContent = value;
          row.append(cell);
        });
        rows.append(row);
      }
    }
    this.querySelector('tbody')!.replaceChildren(rows);
    revealPanelItems(this.querySelector('tbody')!.children, 'X');
    this.querySelector<HTMLElement>('[data-empty]')!.hidden = this.loading || filtered.length > 0;
    const start = filtered.length ? (this.page - 1) * this.size + 1 : 0;
    const end = Math.min(this.page * this.size, filtered.length);
    const range = this.querySelector('[data-range]')!;
    const numbers = document.createElement('strong');
    numbers.className = 'text-[var(--admin-fg)] font-semibold';
    numbers.textContent = start + '–' + end;
    const total = numbers.cloneNode() as HTMLElement;
    total.textContent = String(filtered.length);
    range.replaceChildren('Showing ', numbers, ' of ', total, ' entries');
    const controls = this.querySelector('[data-pages]')!;
    controls.replaceChildren();
    const destinations = [1, Math.max(1, this.page - 1), Math.min(pages, this.page + 1), pages];
    const names = ['First Page', 'Previous Page', 'Next Page', 'Last Page'];
    destinations.forEach((destination, index) => {
      if (index === 2) {
        const label = document.createElement('span');
        label.className = 'px-2.5 text-xs font-semibold text-[var(--admin-fg)] select-none';
        label.textContent = 'Page ' + this.page + ' of ' + pages;
        controls.append(label);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = buttonClass;
      button.title = names[index];
      button.disabled = index < 2 ? this.page === 1 : this.page === pages;
      button.innerHTML =
        '<svg class="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
        paths[index] +
        '"></path></svg>';
      button.addEventListener('click', () => {
        this.page = destination;
        this.update();
      });
      controls.append(button);
    });
  }
}

customElements.define('pnd-guilds', GuildsPage);
