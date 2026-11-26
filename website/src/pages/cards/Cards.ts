import { revealPanelItems } from '@/lib/panel-animations';
import { CardsToolbar } from './CardsToolbar';
import { PanelConfirm } from '@/components/feedback/PanelConfirm';
import {
  deleteCardBackground,
  fetchCardBackgrounds,
  fetchConfig,
  fetchSpecialsCards,
  getCache,
  getCardImageUrl,
  replaceCardBackground,
  setCache,
  type RegimeCardItem,
  type SpecialCardItem,
} from '@/lib/api';
import type { CardCategoryId } from '@/lib/bot';

type Card = RegimeCardItem | SpecialCardItem;
const action =
  'flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-[var(--admin-elevated)] hover:opacity-85 text-xs font-medium text-[var(--admin-fg)] transition-opacity';
const template = document.createElement('template');
template.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6"><div data-content class="space-y-4 p-5">
  <div data-grid class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"></div>
  <div data-empty class="py-12 text-center space-y-1.5" hidden><p class="text-sm font-medium text-[var(--admin-fg)]"></p><p class="text-xs text-[var(--admin-muted)]"></p></div>
</div></div>`;

const tileTemplate = document.createElement('template');
tileTemplate.innerHTML = `
<div tabindex="0" class="relative h-80 cursor-pointer overflow-hidden bg-cover bg-center transition-all duration-500 ease-in-out border-0 select-none shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]">
  <div class="absolute inset-0 bg-[var(--admin-elevated)]/60">
    <div data-loading class="absolute inset-0 flex items-center justify-center bg-black/20"><svg class="h-5 w-5 animate-spin text-white/60" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></div>
    <div data-fallback hidden class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-black/20"><svg class="h-8 w-8 text-white/40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg><span class="text-[11px] text-white/60 break-all"></span></div>
    <img class="h-full w-full object-cover transition-transform duration-500 opacity-0">
  </div>
  <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
  <div class="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10"><p data-category class="text-xs font-light uppercase tracking-widest text-white/80"></p></div>
  <div class="absolute bottom-0 inset-x-0 p-5 text-white z-10 flex flex-col justify-end">
    <h3 class="mt-1 text-2xl font-semibold tracking-tight text-white truncate"></h3>
    <p data-description class="mt-1 text-xs text-white/70 line-clamp-2"></p>
    <div class="mt-3.5 flex items-center justify-between pt-2.5 border-t border-white/15">
      <div data-actions class="flex items-center gap-1.5">
        <button type="button" data-replace title="Replace background image" class="inline-flex items-center gap-1 rounded text-xs bg-black/40 hover:bg-white/20 backdrop-blur-md px-2.5 py-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"><svg class="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg> Replace</button>
        <button type="button" data-delete title="Delete background" class="inline-flex items-center gap-1 rounded text-xs bg-black/40 hover:bg-rose-500/20 backdrop-blur-md p-1.5 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"><svg class="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete</button>
      </div>
    </div>
  </div>
</div>`;

const previewTemplate = document.createElement('template');
previewTemplate.innerHTML = `
<dialog aria-labelledby="card-preview-title" class="w-[calc(100%-2rem)] max-w-sm max-h-[88vh] rounded-3xl border-0 bg-[var(--admin-card)] text-[var(--admin-fg)] p-5 backdrop:bg-black/75 backdrop:backdrop-blur-md">
  <div class="flex items-center justify-between pb-1"><div><h3 id="card-preview-title" class="text-base font-semibold"></h3><p data-id class="text-xs text-[var(--admin-muted)]"></p></div><button data-close type="button" aria-label="Close preview" class="rounded-full p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-elevated)]"><svg class="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></div>
  <div class="flex items-center justify-center py-2"><img class="aspect-[3/4] max-h-[46vh] w-auto object-contain"></div>
  <div class="space-y-3 pt-1"><div class="w-full space-y-1 rounded-2xl bg-[var(--admin-elevated)]/60 p-3 text-xs">
    <div class="flex items-center justify-between py-0.5"><span class="text-[var(--admin-muted)]">Card Type</span><span data-type class="font-medium capitalize"></span></div>
    <div data-assigned class="flex items-center justify-between py-0.5"><span class="text-[var(--admin-muted)]">Assigned Nations</span><span class="font-medium text-emerald-400"></span></div>
    <div data-description class="pt-0.5 text-[var(--admin-muted)] line-clamp-2"></div>
  </div><div class="flex w-full items-center gap-2">
    <a data-open target="_blank" rel="noreferrer" class="${action}"><svg class="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg> Open</a>
    <button data-replace type="button" class="${action}"><svg class="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg> Replace</button>
    <a data-download class="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-[var(--admin-accent)] hover:opacity-90 text-xs font-medium text-[var(--admin-accent-fg)] transition-opacity"><svg class="h-3.5 w-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg> Download</a>
  </div></div>
</dialog>`;

const replaceTemplate = document.createElement('template');
replaceTemplate.innerHTML = `
<dialog aria-labelledby="card-replace-title" class="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-xl border-0 bg-[var(--admin-card)] text-[var(--admin-fg)] p-6 space-y-4 backdrop:bg-black/75 backdrop:backdrop-blur-md">
  <div class="pb-1"><h3 id="card-replace-title" class="text-base font-semibold">Replace Card Background</h3><p data-target class="text-xs text-[var(--admin-muted)]"></p></div>
  <form class="space-y-4">
    <div class="space-y-1.5">
      <label for="replacement-card-file" class="text-xs font-medium">New PNG Image (1428 x 2000 px, max 10MB)</label>
      <input id="replacement-card-file" type="file" accept=".png,image/png" class="sr-only">
      <button data-choose type="button" class="w-full rounded-2xl mt-3 bg-[var(--admin-elevated)]/60 hover:bg-[var(--admin-elevated)] p-3 text-center cursor-pointer transition-colors">
        <span data-placeholder class="flex flex-col items-center gap-2 py-3"><svg class="h-5 w-5 text-[var(--admin-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg><span class="text-xs text-[var(--admin-muted)]">Click to choose replacement PNG</span><span class="text-[10px] text-[var(--admin-muted)]/70">Exactly 1428 x 2000 px, up to 10MB</span></span>
        <span data-preview class="flex flex-col items-center gap-2" hidden><img alt="Preview" class="h-28 object-contain"><span class="text-xs text-[var(--admin-muted)]"></span></span>
      </button>
    </div>
    <p data-error role="alert" class="text-xs text-red-400 bg-red-500/10 rounded-xl p-2.5" hidden></p>
    <div class="flex items-center justify-end gap-2">
      <button data-cancel type="button" class="h-8 px-3 rounded-md text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)]">Cancel</button>
      <button type="submit" class="h-8 px-3 rounded-lg text-xs bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 cursor-pointer disabled:opacity-50">Replace Background</button>
    </div>
  </form>
</dialog>`;

function clone<T extends HTMLElement>(template: HTMLTemplateElement): T {
  return template.content.firstElementChild!.cloneNode(true) as T;
}

export class CardsPage extends HTMLElement {
  searchQuery = '';
  private category: CardCategoryId = 'regimes';
  private regimes = getCache<RegimeCardItem[]>('cards_regimes') ?? [];
  private specials = getCache<SpecialCardItem[]>('cards_specials') ?? [];
  private loading = !this.regimes.length;
  private version = Date.now();
  private generation = 0;
  private fileGeneration = 0;
  private replacing = false;
  private replacement?: string;
  private hovered?: HTMLElement;
  private toolbar = new CardsToolbar();
  private confirm = new PanelConfirm();

  connectedCallback() {
    const generation = ++this.generation;
    this.style.display = 'contents';
    this.replaceChildren(template.content.cloneNode(true), this.confirm);
    this.querySelector('[data-content]')!.prepend(this.toolbar);
    this.renderGrid();
    void fetchConfig();
    void Promise.allSettled([fetchCardBackgrounds(), fetchSpecialsCards()]).then(([regimes, specials]) => {
      if (generation !== this.generation) return;
      if (regimes.status === 'fulfilled' && Array.isArray(regimes.value)) {
        this.regimes = regimes.value;
        setCache('cards_regimes', this.regimes);
      }
      if (specials.status === 'fulfilled' && Array.isArray(specials.value)) {
        this.specials = specials.value;
        setCache('cards_specials', this.specials);
      }
      this.loading = false;
      this.renderGrid();
    });
  }

  disconnectedCallback() {
    ++this.generation;
    ++this.fileGeneration;
    this.querySelectorAll('dialog').forEach((dialog) => dialog.close());
  }

  private imageUrl(card: Card) {
    const url = getCardImageUrl(card.url || ('file' in card ? card.file : (card as SpecialCardItem).card) || card.id);
    return url + (url.includes('?') ? '&' : '?') + 'v=' + this.version;
  }

  private renderGrid() {
    this.toolbar.state = {
      category: this.category,
      query: this.searchQuery,
      selectCategory: (category) => {
        this.category = category;
        this.renderGrid();
      },
      search: (query) => {
        this.searchQuery = query;
        this.renderGrid();
      },
    };
    const grid = this.querySelector('[data-grid]')!;
    const empty = this.querySelector<HTMLElement>('[data-empty]')!;
    this.hovered = undefined;
    if (this.loading) {
      grid.replaceChildren(
        ...Array.from({ length: 8 }, () => {
          const tile = document.createElement('div');
          tile.className =
            'relative h-80 overflow-hidden rounded-xl bg-[var(--admin-card)] border-0 shadow-lg p-5 flex flex-col justify-between animate-pulse';
          tile.innerHTML =
            '<div class="h-3 w-28 rounded bg-[var(--admin-elevated)]"></div><div class="space-y-3"><div class="h-6 w-40 rounded-md bg-[var(--admin-elevated)]"></div><div class="h-3.5 w-24 rounded bg-[var(--admin-elevated)]/60"></div></div>';
          return tile;
        }),
      );
      empty.hidden = true;
      return;
    }
    const query = this.searchQuery.toLowerCase();
    const cards = this.category === 'regimes' ? this.regimes : this.specials;
    const filtered = cards.filter((card) =>
      [card.name, card.id, (card as SpecialCardItem).description].some((value) => value?.toLowerCase().includes(query)),
    );
    grid.replaceChildren(...filtered.map((card) => this.tile(card, this.category)));
    revealPanelItems(grid.children, 'Y');
    empty.hidden = !!filtered.length;
    empty.children[0].textContent = query
      ? `No cards found matching "${this.searchQuery}"`
      : this.category === 'specials'
        ? 'No special cards available'
        : 'No regime cards available';
    empty.children[1].textContent = query
      ? 'Try checking the spelling or search for another card.'
      : 'Cards will appear here once added to the bot.';
  }

  private tile(card: Card, category: CardCategoryId) {
    const tile = clone<HTMLElement>(tileTemplate);
    tile.setAttribute('aria-label', 'Preview ' + card.name);
    const image = tile.querySelector('img')!;
    image.alt = card.name;
    const spinner = tile.querySelector<HTMLElement>('[data-loading]')!;
    image.addEventListener('load', () => {
      spinner.hidden = true;
      image.classList.replace('opacity-0', 'opacity-100');
    });
    image.addEventListener('error', () => {
      spinner.hidden = true;
      image.hidden = true;
      const fallback = tile.querySelector<HTMLElement>('[data-fallback]')!;
      fallback.hidden = false;
      fallback.querySelector('span')!.textContent =
        ('file' in card ? card.file : (card as SpecialCardItem).card) || card.id + '.png';
    });
    image.src = this.imageUrl(card);
    const title = tile.querySelector('h3')!;
    title.title = title.textContent = card.name;
    const count = (card as RegimeCardItem).nationsCount ?? 0;
    tile.querySelector('[data-category]')!.textContent =
      category === 'regimes' ? `${count} ${count === 1 ? 'nation' : 'nations'} use this` : 'Special Card';
    const description = tile.querySelector<HTMLElement>('[data-description]')!;
    description.textContent = category === 'specials' ? ((card as SpecialCardItem).description ?? '') : '';
    description.hidden = !description.textContent;
    tile.querySelector<HTMLElement>('[data-actions]')!.hidden = category !== 'regimes';
    tile.querySelector('[data-replace]')!.addEventListener('click', (event) => {
      event.stopPropagation();
      this.openReplace(card as RegimeCardItem);
    });
    tile.querySelector('[data-delete]')!.addEventListener('click', (event) => {
      event.stopPropagation();
      this.openDelete(card as RegimeCardItem);
    });
    tile.addEventListener('click', () => this.openPreview(card, category));
    tile.addEventListener('keydown', (event) => {
      if (event.target === tile && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        this.openPreview(card, category);
      }
    });
    tile.addEventListener('mouseenter', () => this.highlight(tile));
    tile.addEventListener('mouseleave', () => {
      if (this.hovered === tile) this.highlight();
    });
    tile.addEventListener('focus', () => this.highlight(tile));
    tile.addEventListener('blur', () => {
      if (this.hovered === tile) this.highlight();
    });
    return tile;
  }

  private highlight(active?: HTMLElement) {
    this.hovered = active;
    for (const tile of this.querySelector('[data-grid]')!.children) {
      const selected = tile === active;
      const muted = !!active && !selected;
      tile.classList.toggle('scale-105', selected);
      tile.classList.toggle('z-10', selected);
      for (const className of ['scale-[0.97]', 'opacity-60', 'blur-[2px]']) tile.classList.toggle(className, muted);
    }
  }

  private show(dialog: HTMLDialogElement, busy = () => false) {
    dialog.addEventListener('cancel', (event) => {
      if (busy()) event.preventDefault();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && !busy()) dialog.close();
    });
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    this.append(dialog);
    dialog.showModal();
  }

  private openPreview(card: Card, category: CardCategoryId) {
    const dialog = clone<HTMLDialogElement>(previewTemplate);
    dialog.querySelector('h3')!.textContent = card.name;
    dialog.querySelector('[data-id]')!.textContent = 'ID: ' + card.id;
    dialog.querySelector('[data-type]')!.textContent = category;
    const assigned = dialog.querySelector<HTMLElement>('[data-assigned]')!;
    assigned.hidden = category !== 'regimes';
    assigned.lastElementChild!.textContent = ((card as RegimeCardItem).nationsCount ?? 0) + ' nations';
    dialog.querySelector('[data-description]')!.textContent =
      category === 'specials' ? ((card as SpecialCardItem).description ?? '') : '';
    const image = dialog.querySelector('img')!;
    image.alt = card.name;
    image.addEventListener('error', () => {
      image.hidden = true;
    });
    image.src = this.imageUrl(card);
    for (const link of dialog.querySelectorAll('a')) link.href = image.src;
    dialog.querySelector<HTMLAnchorElement>('[data-download]')!.download = card.id + '.png';
    dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());
    const replace = dialog.querySelector<HTMLButtonElement>('[data-replace]')!;
    replace.hidden = category !== 'regimes';
    replace.addEventListener('click', () => {
      dialog.close();
      this.openReplace(card as RegimeCardItem);
    });
    this.show(dialog);
  }

  private openReplace(card: RegimeCardItem) {
    const view = this.generation;
    const dialog = clone<HTMLDialogElement>(replaceTemplate);
    this.replacement = undefined;
    dialog.querySelector('[data-target]')!.textContent = `Overwrites ${card.name} (${card.id}.png)`;
    const input = dialog.querySelector('input')!;
    const submit = dialog.querySelector<HTMLButtonElement>('[type="submit"]')!;
    const cancel = dialog.querySelector<HTMLButtonElement>('[data-cancel]')!;
    const choose = dialog.querySelector<HTMLButtonElement>('[data-choose]')!;
    const preview = dialog.querySelector<HTMLElement>('[data-preview]')!;
    const placeholder = dialog.querySelector<HTMLElement>('[data-placeholder]')!;
    const error = dialog.querySelector<HTMLElement>('[data-error]')!;
    const update = (message = '') => {
      error.hidden = !message;
      error.textContent = message;
      submit.disabled = this.replacing || !this.replacement;
      choose.disabled = input.disabled = cancel.disabled = this.replacing;
      preview.hidden = !this.replacement;
      placeholder.hidden = !!this.replacement;
    };
    update();
    choose.addEventListener('click', () => input.click());
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      ++this.fileGeneration;
      this.replacement = undefined;
    });
    input.addEventListener('change', async () => {
      const generation = ++this.fileGeneration;
      const file = input.files?.[0];
      this.replacement = undefined;
      update();
      if (!file) return;
      try {
        if (!/\.png$/i.test(file.name) || file.size > 10 * 1024 * 1024) throw new Error('Choose a PNG up to 10MB.');
        const bitmap = await createImageBitmap(file);
        const valid = bitmap.width === 1428 && bitmap.height === 2000;
        bitmap.close();
        if (!valid) throw new Error('The PNG must be exactly 1428 x 2000 pixels.');
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        if (generation !== this.fileGeneration || !dialog.open) return;
        this.replacement = data;
        preview.querySelector('img')!.src = data;
        preview.querySelector('span')!.textContent = file.name;
        update();
      } catch (failure) {
        if (generation === this.fileGeneration && dialog.open)
          update(failure instanceof Error ? failure.message : 'Could not read the PNG.');
      }
    });
    dialog.querySelector('form')!.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!this.replacement || this.replacing) return;
      this.replacing = true;
      update();
      try {
        const result = await replaceCardBackground(card.id, this.replacement.split(',')[1]);
        if (!result.ok) throw new Error(result.error || 'Replacement failed');
        if (view !== this.generation) return;
        this.version = Date.now();
        dialog.close();
        this.renderGrid();
      } catch (failure) {
        if (dialog.open) error.textContent = failure instanceof Error ? failure.message : 'Replacement failed';
      } finally {
        this.replacing = false;
        if (dialog.open) update(error.textContent ?? '');
      }
    });
    this.show(dialog, () => this.replacing);
  }

  private openDelete(card: RegimeCardItem) {
    const view = this.generation;
    const state = {
      open: true,
      title: `Delete "${card.name}" background?`,
      description:
        'This will permanently delete this card background from the bot. Make sure no active nations rely on this background.',
      confirmText: 'Delete Background',
      onClose: () => this.confirm.update({ ...state, open: false }),
      onConfirm: async () => {
        this.confirm.update({ ...state, isLoading: true });
        try {
          const result = await deleteCardBackground(card.id);
          if (!result.ok) throw new Error(result.error || 'Could not delete the background.');
          const remaining = (getCache<RegimeCardItem[]>('cards_regimes') ?? this.regimes).filter(
            (item) => item.id !== card.id,
          );
          setCache('cards_regimes', remaining);
          if (view !== this.generation) return;
          this.regimes = remaining;
          state.onClose();
          this.renderGrid();
        } catch (failure) {
          if (view === this.generation)
            this.confirm.update({
              ...state,
              description: failure instanceof Error ? failure.message : 'Could not delete the background.',
            });
        }
      },
    };
    this.confirm.update(state);
  }
}

customElements.define('pnd-cards-page', CardsPage);
