import { cardCategories, type CardCategoryId } from '@/lib/bot';

interface CardsToolbarState {
  category: CardCategoryId;
  query: string;
  selectCategory: (category: CardCategoryId) => void;
  search: (query: string) => void;
}

const template = document.createElement('template');
template.innerHTML = `
<div class="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div data-categories class="inline-flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)] w-fit flex-wrap"></div>
  <div class="flex items-center gap-2">
    <div class="relative min-w-0 flex-1 sm:w-64">
      <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
      <input type="text" aria-label="Search cards" placeholder="Search cards..." class="flex w-full border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 h-9 rounded-full bg-[var(--admin-elevated)] pl-9 pr-4 text-xs text-[var(--admin-fg)] focus-visible:ring-0">
    </div>
  </div>
</div>`;

export class CardsToolbar extends HTMLElement {
  private current?: CardsToolbarState;
  private buttons = new Map<CardCategoryId, HTMLButtonElement>();

  set state(state: CardsToolbarState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  connectedCallback() {
    this.style.display = 'block';
    if (!this.hasChildNodes()) {
      this.append(template.content.cloneNode(true));
      const input = this.querySelector('input')!;
      input.addEventListener('input', () => this.current?.search(input.value));
      const categories = this.querySelector('[data-categories]')!;
      for (const { id, label } of cardCategories) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className =
          'relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors flex items-center justify-center cursor-pointer select-none touch-manipulation';
        const highlight = document.createElement('span');
        highlight.className = 'absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0';
        const text = document.createElement('span');
        text.className = 'relative z-10';
        text.textContent = label;
        button.append(highlight, text);
        button.addEventListener('click', () => this.current?.selectCategory(id));
        categories.append(button);
        this.buttons.set(id, button);
      }
    }
    this.update();
  }

  private update() {
    if (!this.current) return;
    const input = this.querySelector('input')!;
    if (input.value !== this.current.query) input.value = this.current.query;
    for (const [id, button] of this.buttons) {
      const active = this.current.category === id;
      button.setAttribute('aria-pressed', String(active));
      (button.firstElementChild as HTMLElement).hidden = !active;
      button.classList.toggle('text-[var(--admin-accent-fg)]', active);
      button.classList.toggle('text-[var(--admin-muted)]', !active);
      button.classList.toggle('hover:text-[var(--admin-fg)]', !active);
    }
  }
}

customElements.define('pnd-cards-toolbar', CardsToolbar);
