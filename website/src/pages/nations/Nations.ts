import { revealPanelItems } from '@/lib/panel-animations';
import { PanelConfirm } from '@/components/feedback/PanelConfirm';
import { admin } from '@/lib/admin-classes';
import { deleteNation, fetchCollectibles, getCache, type CollectibleEntry } from '@/lib/api';
import { bot, formatRarity, rarityBadgeClass } from '@/lib/bot';

const gridClasses = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';
const template = document.createElement('template');
template.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6"><div class="rounded-lg space-y-4 p-5">
  <div class="relative z-20 flex flex-col gap-2 md:flex-row md:items-center">
    <div class="relative min-w-0 flex-1">
      <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${admin.muted}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
      <input aria-label="Search by name or ID" placeholder="Search by name or ID..." class="flex h-9 w-full pl-9 pr-3 rounded-md border-0 outline-none ring-0 focus:outline-none focus:ring-0 py-2 text-sm ${admin.input}">
    </div>
    <div class="relative flex items-center rounded-md border min-h-9 h-9 w-full shrink-0 text-xs md:w-36 ${admin.input}">
      <select aria-label="Rarity class" style="color-scheme:dark" class="h-full w-full cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none"><option value="all">All classes</option></select>
      <svg class="pointer-events-none absolute right-3 h-4 w-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
    </div>
    <button data-add type="button" class="inline-flex items-center justify-center h-9 shrink-0 gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3 text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90"><svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14 M5 12h14"></path></svg><span>Add Nation</span></button>
  </div>
  <div data-grid class="${gridClasses}"></div>
  <p data-status hidden class="py-8 text-center text-sm ${admin.muted}" role="status"></p>
</div></div>`;

const tile = document.createElement('template');
tile.innerHTML = `
<article class="group relative block h-60 sm:h-64">
  <span class="absolute inset-0 border-2 border-dashed border-[var(--admin-border)]"></span>
  <div class="relative h-full w-full transform border-2 border-[var(--admin-border)] bg-[var(--admin-card)] transition-transform duration-200 group-hover:-translate-x-2 group-hover:-translate-y-2">
    <div data-summary class="absolute inset-0 flex flex-col items-center justify-center p-5 text-center transition-opacity duration-200 group-hover:pointer-events-none group-hover:opacity-0 sm:p-6">
      <h3 class="text-lg font-bold leading-snug ${admin.fg} sm:text-xl break-words line-clamp-3"></h3>
      <div class="mt-3 flex items-center justify-center gap-2"><span data-id class="text-xs ${admin.muted}"></span><span data-rarity class="rounded px-2 py-0.5 text-xs font-medium capitalize"></span></div>
    </div>
    <div data-detail class="absolute inset-0 flex flex-col justify-between p-5 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 sm:p-6">
      <div class="border-b border-[var(--admin-border)] pb-2.5"><h3 class="text-base font-bold leading-snug ${admin.fg} sm:text-lg break-words line-clamp-2"></h3></div>
      <div class="flex-1 flex flex-col justify-center py-2"><div class="grid grid-cols-2 gap-3 w-full">
        <div class="rounded-lg bg-[var(--admin-elevated)]/60 p-2.5 text-center"><span class="block text-[11px] ${admin.muted}">Global Caught</span><span data-caught class="mt-0.5 block text-base font-bold tabular-nums ${admin.fg} sm:text-lg"></span></div>
        <div class="rounded-lg bg-[var(--admin-elevated)]/60 p-2.5 text-center"><span class="block text-[11px] ${admin.muted}">Spawn Weight</span><span data-weight class="mt-0.5 block text-base font-bold tabular-nums ${admin.fg} sm:text-lg"></span></div>
      </div></div>
      <div class="grid grid-cols-2 gap-2 w-full pt-1">
        <button type="button" data-edit class="inline-flex items-center justify-center rounded-md h-8 w-full bg-[var(--admin-elevated)] text-xs font-medium ${admin.fg} hover:bg-[var(--admin-elevated)]/80">Edit</button>
        <button type="button" data-delete class="inline-flex items-center justify-center rounded-md h-8 w-full bg-[var(--admin-elevated)] text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-400">Delete</button>
      </div>
    </div>
  </div>
</article>`;

const loadEditor = () => import('./NationEdit');

export class NationsPage extends HTMLElement {
  searchQuery = '';
  onCountChange?: (count: number) => void;
  private catalog = getCache<CollectibleEntry[]>('collectibles_all') ?? [];
  private rarity = 'all';
  private loading = !this.catalog.length;
  private generation = 0;
  private failed = false;
  private editorCleanup?: () => void;
  private confirm = new PanelConfirm();

  connectedCallback() {
    this.style.display = 'contents';
    this.showCatalog();
    void this.load();
  }

  disconnectedCallback() {
    ++this.generation;
    this.editorCleanup?.();
  }

  private showCatalog() {
    this.editorCleanup?.();
    this.editorCleanup = undefined;
    this.replaceChildren(template.content.cloneNode(true), this.confirm);
    const search = this.querySelector('input')!;
    search.value = this.searchQuery;
    search.addEventListener('input', () => {
      this.searchQuery = search.value;
      this.renderGrid();
    });
    const rarity = this.querySelector('select')!;
    for (const value of bot.rarityClasses) rarity.add(new Option(formatRarity(value), value));
    rarity.value = this.rarity;
    rarity.addEventListener('change', () => {
      this.rarity = rarity.value;
      this.renderGrid();
    });
    this.editorButton(this.querySelector<HTMLButtonElement>('[data-add]')!);
    this.renderGrid();
  }

  private async load() {
    const generation = ++this.generation;
    const items = await fetchCollectibles().catch(() => null);
    if (generation !== this.generation) return;
    const changed =
      this.loading || this.failed !== !items || (items && JSON.stringify(items) !== JSON.stringify(this.catalog));
    this.loading = false;
    this.failed = !items;
    if (Array.isArray(items)) this.catalog = items;
    this.onCountChange?.(this.catalog.length);
    if (changed) this.renderGrid();
  }

  private renderGrid() {
    const grid = this.querySelector('[data-grid]');
    if (!grid) return;
    const status = this.querySelector<HTMLElement>('[data-status]')!;
    if (this.loading) {
      grid.replaceChildren(
        ...Array.from({ length: 6 }, () => {
          const placeholder = document.createElement('div');
          placeholder.className =
            'h-60 sm:h-64 rounded-xl border-2 border-[var(--admin-border)] bg-[var(--admin-card)] p-5 flex flex-col items-center justify-center space-y-3 animate-pulse';
          placeholder.innerHTML =
            '<pnd-skeleton data-custom-radius class="h-6 w-36 rounded"></pnd-skeleton><div class="flex gap-2"><pnd-skeleton data-custom-radius class="h-4 w-16 rounded"></pnd-skeleton><pnd-skeleton data-custom-radius class="h-4 w-20 rounded"></pnd-skeleton></div>';
          return placeholder;
        }),
      );
      return;
    }
    const query = this.searchQuery.toLowerCase();
    const matches = this.catalog.filter(
      (entry) =>
        (this.rarity === 'all' || entry.class === this.rarity) &&
        (entry.name.toLowerCase().includes(query) || entry.id.toLowerCase().includes(query)),
    );
    grid.replaceChildren(...matches.map((entry) => this.card(entry)));
    revealPanelItems(grid.children, 'Y');
    status.hidden = matches.length > 0 && !this.failed;
    status.textContent = this.failed ? 'Could not refresh the catalog.' : 'No catalog entries match.';
  }

  private card(entry: CollectibleEntry) {
    const card = tile.content.firstElementChild!.cloneNode(true) as HTMLElement;
    card.querySelectorAll('h3').forEach((title) => {
      title.textContent = title.title = entry.name;
    });
    card.querySelector('[data-id]')!.textContent = 'ID: ' + entry.id;
    const rarity = card.querySelector<HTMLElement>('[data-rarity]')!;
    rarity.textContent = formatRarity(entry.class);
    rarity.className += ' ' + (rarityBadgeClass[entry.class] ?? '');
    card.querySelector('[data-caught]')!.textContent = entry.globalCaught.toLocaleString();
    card.querySelector('[data-weight]')!.textContent = String(entry.weight);
    this.editorButton(card.querySelector<HTMLButtonElement>('[data-edit]')!, entry.id);
    card.querySelector('[data-delete]')!.addEventListener('click', () => this.removeNation(entry));
    const summary = card.querySelector<HTMLElement>('[data-summary]')!;
    const detail = card.querySelector<HTMLElement>('[data-detail]')!;
    const reveal = () => {
      summary.style.opacity = '0';
      summary.style.pointerEvents = 'none';
      detail.style.opacity = '1';
      detail.style.pointerEvents = 'auto';
    };
    card.addEventListener('focusin', reveal);
    card.addEventListener('focusout', (event) => {
      if (event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) return;
      summary.style.removeProperty('opacity');
      summary.style.removeProperty('pointer-events');
      detail.style.removeProperty('opacity');
      detail.style.removeProperty('pointer-events');
    });
    card.addEventListener('click', (event) => {
      if (!(event.target instanceof Element) || !event.target.closest('button')) reveal();
    });
    return card;
  }

  private editorButton(button: HTMLButtonElement, id?: string) {
    const preload = () => void loadEditor().catch(() => {});
    button.addEventListener('pointerenter', preload, { once: true });
    button.addEventListener('focus', preload, { once: true });
    button.addEventListener('click', () => void this.openEditor(id));
  }

  private async openEditor(id?: string) {
    const generation = ++this.generation;
    const host = document.createElement('div');
    host.textContent = 'Loading…';
    this.replaceChildren(host);
    try {
      const { NationEdit } = await loadEditor();
      if (generation !== this.generation) return;
      host.replaceChildren();
      const editor = new NationEdit();
      editor.nationId = id;
      editor.onBack = () => {
        this.showCatalog();
        void this.load();
      };
      host.append(editor);
      this.editorCleanup = () => editor.remove();
    } catch {
      if (generation !== this.generation) return;
      const back = document.createElement('button');
      back.type = 'button';
      back.textContent = 'Back to Nations';
      back.addEventListener('click', () => {
        this.showCatalog();
        void this.load();
      });
      host.replaceChildren('Could not load the nation editor. ', back);
    }
  }

  private removeNation(entry: CollectibleEntry) {
    const state = {
      open: true,
      title: 'Delete Collectible?',
      description: `Are you sure you want to delete ${entry.name} (${entry.id}) from the catalog?`,
      confirmText: 'Delete Collectible',
      onClose: () => this.confirm.update({ ...state, open: false }),
      onConfirm: async () => {
        this.confirm.update({ ...state, isLoading: true });
        const result = await deleteNation(entry.id, true).catch(() => null);
        if (!this.isConnected) return;
        if (!result?.ok) {
          this.confirm.update({ ...state, description: result?.error ?? 'Could not delete the collectible.' });
          return;
        }
        ++this.generation;
        this.loading = false;
        this.catalog = this.catalog.filter((item) => item.id !== entry.id);
        this.onCountChange?.(this.catalog.length);
        state.onClose();
        this.renderGrid();
      },
    };
    this.confirm.update(state);
  }
}

customElements.define('pnd-nations', NationsPage);
