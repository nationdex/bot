import { PanelConfirm } from '@/components/feedback/PanelConfirm';
import { admin } from '@/lib/admin-classes';
import { fetchInstancesPage, removeUserNation, type NationInstanceEntry } from '@/lib/api';
import { bot, formatRarity } from '@/lib/bot';

function formatTimeToCatch(val: number | string): string {
  const ms = typeof val === 'number' ? val : parseInt(String(val), 10);
  if (isNaN(ms) || ms <= 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  if (seconds <= 0) return '0s';

  const mo = Math.floor(seconds / 2592000);
  const d = Math.floor((seconds % 2592000) / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (mo > 0) parts.push(`${mo}mo`);
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
}

const template = document.createElement('template');
template.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center flex-1">
      <div class="relative w-full sm:w-64">
        <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${admin.muted}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
        <input aria-label="Search instances" placeholder="Search instances like India" class="flex w-full border-0 outline-none py-2 px-3 pl-9 h-9 rounded-lg bg-[var(--admin-card)] text-xs ${admin.fg} placeholder:text-[var(--admin-muted)]">
      </div>
      <div class="relative flex items-center h-9 w-full sm:w-36 text-xs rounded-lg ${admin.card} ${admin.fg}">
        <select data-rarity aria-label="Instance class" class="h-full w-full cursor-pointer appearance-none rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none"><option value="all">All Classes</option></select>
        <svg class="pointer-events-none absolute right-3 h-4 w-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
      </div>
    </div>
    <div data-selection hidden class="flex items-center gap-2 shrink-0">
      <span class="text-xs ${admin.muted}"></span>
      <button data-delete-selected type="button" class="h-8 px-3 text-xs font-medium bg-[var(--admin-card)] text-red-400/90 rounded-lg hover:bg-red-500/10 hover:text-red-400">Delete Selected</button>
    </div>
  </div>
  <div class="bg-[var(--admin-card)] overflow-x-auto rounded-xl ${admin.card}">
    <div class="overflow-x-auto w-full">
      <table class="w-full min-w-[640px]">
        <thead><tr class="border-b border-[var(--admin-border)]">
          <th class="w-10 py-3.5 pl-5 sm:pl-6 pr-3 text-left"><input data-select-all type="checkbox" aria-label="Select all on this page" class="h-4 w-4 rounded accent-zinc-500 cursor-pointer"></th>
          ${['Description', 'Class', 'Player', 'Time to Catch'].map((label) => `<th class="py-3.5 px-4 text-left text-xs font-semibold ${admin.muted}">${label}</th>`).join('')}
          <th class="py-3.5 pr-5 sm:pr-6 text-right text-xs font-semibold ${admin.muted}">Actions</th>
        </tr></thead><tbody></tbody>
      </table>
    </div>
    <div data-empty hidden class="py-12 text-center space-y-1.5"><p class="text-sm font-medium ${admin.fg}"></p><p class="text-xs ${admin.muted}"></p></div>
    <div data-pagination hidden class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs ${admin.muted}">
      <div class="flex items-center gap-4 flex-wrap"><label class="flex items-center gap-2">Rows per page:
        <select name="pagesize" class="bg-[var(--admin-elevated)] ${admin.fg} rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none cursor-pointer"><option>5</option><option selected>10</option><option>25</option><option>50</option></select>
      </label><span data-range></span></div>
      <div data-pages class="flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)]"></div>
    </div>
  </div>
</div>`;

const pageButtons = [
  ['First Page', 'm11 17-5-5 5-5 M18 17l-5-5 5-5'],
  ['Previous Page', 'm15 18-6-6 6-6'],
  ['Next Page', 'm9 18 6-6-6-6'],
  ['Last Page', 'm6 17 5-5-5-5 M13 17l5-5-5-5'],
];

export class InstancesPage extends HTMLElement {
  searchQuery = '';
  private rarity = 'all';
  private page = 1;
  private pageSize = 10;
  private total = 0;
  private items: NationInstanceEntry[] = [];
  private selected = new Map<string, NationInstanceEntry>();
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private loading = true;
  private readonly modal = new PanelConfirm();

  connectedCallback() {
    this.style.display = 'contents';
    this.replaceChildren(template.content.cloneNode(true), this.modal);
    const input = this.querySelector('input')!;
    input.value = this.searchQuery;
    input.addEventListener('input', () => {
      this.searchQuery = input.value;
      this.page = 1;
      ++this.generation;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => void this.load(), 250);
    });
    const select = this.querySelector<HTMLSelectElement>('[data-rarity]')!;
    for (const rarity of bot.rarityClasses) select.add(new Option(formatRarity(rarity), rarity));
    select.addEventListener('change', () => {
      this.rarity = select.value;
      this.page = 1;
      void this.load();
    });
    const pageSize = this.querySelector<HTMLSelectElement>('select[name="pagesize"]')!;
    pageSize.value = String(this.pageSize);
    pageSize.addEventListener('change', () => {
      this.pageSize = Number(pageSize.value);
      this.page = 1;
      void this.load();
    });
    this.querySelector<HTMLInputElement>('[data-select-all]')!.addEventListener('change', (event) => {
      for (const item of this.items) {
        if ((event.currentTarget as HTMLInputElement).checked) this.selected.set(item.id, item);
        else this.selected.delete(item.id);
      }
      this.updateSelection();
    });
    this.querySelector('[data-delete-selected]')!.addEventListener('click', () =>
      this.confirmDelete([...this.selected.values()], true),
    );
    void this.load();
  }

  disconnectedCallback() {
    ++this.generation;
    clearTimeout(this.timer);
  }

  private async load() {
    clearTimeout(this.timer);
    const generation = ++this.generation;
    this.loading = true;
    this.renderPage();
    const data = await fetchInstancesPage({
      query: this.searchQuery.trim(),
      rarity: this.rarity,
      page: this.page,
      pageSize: this.pageSize,
    }).catch(() => null);
    if (!this.isConnected || generation !== this.generation) return;
    this.loading = false;
    if (data) {
      this.items = data.items;
      this.total = data.total;
      const lastPage = Math.max(1, Math.ceil(this.total / this.pageSize));
      if (this.page > lastPage) {
        this.page = lastPage;
        void this.load();
        return;
      }
    }
    this.renderPage();
  }

  private confirmDelete(items: NationInstanceEntry[], bulk = false) {
    if (!items.length) return;
    const item = items[0];
    const suffix = items.length === 1 ? '' : 's';
    const state = {
      open: true,
      title: bulk ? `Delete ${items.length} Selected Instance${suffix}?` : 'Delete Nation Instance?',
      description: bulk
        ? `Are you sure you want to permanently delete ${items.length} selected nation instance${suffix}? This action cannot be undone.`
        : `Are you sure you want to delete instance #${item.id} (${item.description}) owned by ${item.player}?`,
      confirmText: bulk ? 'Delete Selected' : 'Delete Instance',
      onClose: () => this.modal.update({ ...state, open: false }),
      onConfirm: async () => {
        this.modal.update({ ...state, isLoading: true });
        let failed = 0;
        await Promise.all(
          items.map(async (target) => {
            const result = await removeUserNation(target.player, target.id).catch(() => null);
            if (result && result.ok !== false) this.selected.delete(target.id);
            else failed++;
          }),
        );
        if (!this.isConnected) return;
        if (failed) {
          this.modal.update({
            ...state,
            title: 'Could not delete every selected instance',
            description: `${failed} instance${failed === 1 ? '' : 's'} could not be deleted. Close this dialog and try again.`,
            confirmText: 'Close',
            onConfirm: state.onClose,
          });
        } else state.onClose();
        void this.load();
      },
    };
    this.modal.update(state);
  }

  private updateSelection() {
    const selection = this.querySelector<HTMLElement>('[data-selection]')!;
    selection.hidden = !this.selected.size;
    selection.querySelector('span')!.textContent = this.selected.size + ' selected';
    const all = this.querySelector<HTMLInputElement>('[data-select-all]')!;
    all.disabled = this.loading || !this.items.length;
    all.checked = !all.disabled && this.items.every((item) => this.selected.has(item.id));
    this.querySelectorAll<HTMLInputElement>('tbody input').forEach((input) => {
      input.checked = this.selected.has(input.value);
      input.closest('tr')!.classList.toggle('bg-[var(--admin-elevated)]/60', input.checked);
    });
  }

  private renderPage() {
    const body = this.querySelector('tbody')!;
    body.replaceChildren();
    if (this.loading) {
      const widths = [
        'h-4 w-4',
        'h-4 w-40 sm:w-48',
        'h-5 w-16 rounded-full',
        'h-4 w-24 sm:w-28',
        'h-4 w-16',
        'h-7 w-14 ml-auto',
      ];
      for (let i = 0; i < Math.min(10, this.pageSize); i++) {
        const row = body.insertRow();
        row.className = 'border-b border-[var(--admin-border)] last:border-0 animate-pulse';
        widths.forEach((width, index) => {
          const cell = row.insertCell();
          cell.className =
            index === 0 ? 'py-3.5 pl-5 sm:pl-6 pr-3' : index === 5 ? 'py-3.5 pr-5 sm:pr-6 text-right' : 'py-3.5 px-4';
          const placeholder = document.createElement('div');
          placeholder.className = width + ' bg-[var(--admin-elevated)]' + (index === 2 ? '' : ' rounded');
          cell.append(placeholder);
        });
      }
    } else {
      for (const item of this.items) this.renderRow(body.insertRow(), item);
    }
    const empty = this.querySelector<HTMLElement>('[data-empty]')!;
    empty.hidden = this.loading || this.total > 0;
    const filtered = this.searchQuery || this.rarity !== 'all';
    empty.children[0].textContent = this.searchQuery
      ? `No nation instances found matching "${this.searchQuery}"`
      : this.rarity !== 'all'
        ? `No nation instances found in class "${formatRarity(this.rarity as Parameters<typeof formatRarity>[0])}"`
        : 'No nation instances found';
    empty.children[1].textContent = filtered
      ? 'Try checking the spelling or resetting the filters.'
      : 'Instances will appear here once nations are caught by players.';
    this.updateSelection();
    this.renderPagination();
  }

  private renderRow(row: HTMLTableRowElement, item: NationInstanceEntry) {
    row.className = 'border-b border-[var(--admin-border)] last:border-0 transition-colors ' + admin.hoverRow;
    const selectCell = row.insertCell();
    selectCell.className = 'py-3 pl-5 sm:pl-6 pr-3';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = item.id;
    input.setAttribute('aria-label', 'Select instance ' + item.id);
    input.className = 'h-4 w-4 rounded accent-zinc-500 cursor-pointer';
    input.addEventListener('change', () => {
      if (input.checked) this.selected.set(item.id, item);
      else this.selected.delete(item.id);
      this.updateSelection();
    });
    selectCell.append(input);
    const description = row.insertCell();
    description.className = 'py-3 px-4 text-sm font-medium ' + admin.fg;
    description.textContent = item.description;
    const rarity = document.createElement('span');
    rarity.className =
      'capitalize px-2 py-0.5 rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-[11px] font-medium';
    rarity.textContent = formatRarity(item.class);
    const rarityCell = row.insertCell();
    rarityCell.className = 'py-3 px-4 text-xs';
    rarityCell.append(rarity);
    const player = row.insertCell();
    player.className = 'py-3 px-4 text-sm ' + admin.fg;
    player.textContent = item.player;
    const time = row.insertCell();
    time.className = 'py-3 px-4 text-sm ' + admin.muted;
    time.textContent = formatTimeToCatch(item.timeToCatch);
    const actions = row.insertCell();
    actions.className = 'py-3 pr-5 sm:pr-6 text-right';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors h-7 px-2.5 text-xs bg-[var(--admin-elevated)] text-red-400/80 hover:bg-red-500/10 hover:text-red-400';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => this.confirmDelete([item]));
    actions.append(remove);
  }

  private renderPagination() {
    const pagination = this.querySelector<HTMLElement>('[data-pagination]')!;
    pagination.hidden = this.loading || !this.total;
    if (pagination.hidden) return;
    const pages = Math.max(1, Math.ceil(this.total / this.pageSize));
    const range = pagination.querySelector('[data-range]')!;
    const numbers = document.createElement('strong');
    numbers.className = 'text-[var(--admin-fg)] font-semibold';
    numbers.textContent = `${(this.page - 1) * this.pageSize + 1}–${Math.min(this.page * this.pageSize, this.total)}`;
    const total = numbers.cloneNode() as HTMLElement;
    total.textContent = String(this.total);
    range.replaceChildren('Showing ', numbers, ' of ', total, ' entries');
    const controls = pagination.querySelector('[data-pages]')!;
    controls.replaceChildren();
    const destinations = [1, this.page - 1, this.page + 1, pages];
    pageButtons.forEach(([title, path], index) => {
      if (index === 2) {
        const label = document.createElement('span');
        label.className = 'px-2.5 text-xs font-semibold text-[var(--admin-fg)] select-none';
        label.textContent = `Page ${this.page} of ${pages}`;
        controls.append(label);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.title = title;
      button.className =
        'inline-flex items-center justify-center h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40';
      button.disabled = index < 2 ? this.page === 1 : this.page === pages;
      button.innerHTML = `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"></path></svg>`;
      button.addEventListener('click', () => {
        this.page = destinations[index];
        void this.load();
      });
      controls.append(button);
    });
  }
}

customElements.define('pnd-instances', InstancesPage);
