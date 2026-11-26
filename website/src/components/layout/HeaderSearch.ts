import { panelMotionEnabled } from '@/lib/panel-animations';
import { searchAdmin, searchTypeLabels, type SearchResult } from '@/lib/search';

const template = document.createElement('template');
template.innerHTML = `
  <button type="button" aria-label="Search admin panel" aria-expanded="false" aria-haspopup="dialog" class="rounded-lg p-2 text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-fg)]">
    <svg class="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
  </button>
`;
const overlayTemplate = document.createElement('template');
overlayTemplate.innerHTML = `
  <button type="button" aria-label="Close search" class="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"></button>
  <div role="dialog" aria-modal="true" aria-label="Search" class="fixed left-1/2 top-[max(1rem,12vh)] z-[101] w-[min(calc(100vw-1.5rem),34rem)] -translate-x-1/2 overflow-hidden rounded-xl bg-[var(--admin-panel)]">
    <div class="flex items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
      <svg class="h-4 w-4 shrink-0 text-[var(--admin-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
      <input aria-label="Search whole panel" placeholder="Search whole panel (pages, settings, nations, users...)" class="flex w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 py-2 text-sm h-9 flex-1 bg-transparent px-0 text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)]">
      <button type="button" aria-label="Close" class="rounded-md p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-fg)]">
        <svg class="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18 M6 6l12 12"></path></svg>
      </button>
    </div>
    <ul class="max-h-[min(55vh,24rem)] overflow-y-auto p-1.5"></ul>
    <div class="flex items-center justify-between border-t border-[var(--admin-border)] px-3 py-2 text-[10px] text-[var(--admin-muted)]"><span>↑↓ navigate | Enter open | Esc close</span><kbd class="rounded bg-[var(--admin-elevated)] px-1.5 py-0.5">Ctrl K</kbd></div>
  </div>
`;

export class HeaderSearch extends HTMLElement {
  navigate?: (section: string, query?: string) => void;
  private overlay?: HTMLDivElement;
  private activeIndex = 0;
  private results: SearchResult[] = [];
  private previousFocus: HTMLElement | null = null;

  connectedCallback() {
    this.style.display = 'contents';
    if (!this.hasChildNodes()) {
      this.append(template.content.cloneNode(true));
      this.querySelector('button')!.addEventListener('click', () => this.open());
    }
    window.addEventListener('keydown', this.keydown);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.keydown);
    this.close();
  }

  private readonly keydown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Escape' && this.overlay) {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Tab' && this.overlay) {
      const controls = Array.from(this.overlay.querySelectorAll<HTMLElement>('input,button')).filter(
        (x) => x.offsetParent !== null,
      );
      const index = controls.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? index - 1 : index + 1;
      if (next < 0 || next >= controls.length) {
        event.preventDefault();
        controls[event.shiftKey ? controls.length - 1 : 0]?.focus();
      }
    }
  };

  private open() {
    if (this.overlay) {
      this.overlay.querySelector('input')!.focus();
      return;
    }
    this.previousFocus = document.activeElement as HTMLElement;
    this.activeIndex = 0;
    const overlay = document.createElement('div');
    overlay.append(overlayTemplate.content.cloneNode(true));
    document.body.append(overlay);
    this.overlay = overlay;
    if (panelMotionEnabled('searchMotion')) {
      overlay.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }], 160);
      overlay.querySelector('[role="dialog"]')?.animate(
        [
          { opacity: 0, translate: '0 -8px', scale: '.97' },
          { opacity: 1, translate: '0 0', scale: '1' },
        ],
        { duration: 180, easing: 'ease-out' },
      );
    }
    overlay.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => this.close()));
    const input = overlay.querySelector('input')!;
    input.addEventListener('input', () => {
      this.activeIndex = 0;
      this.update(input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = Math.max(
          0,
          Math.min(this.results.length - 1, this.activeIndex + (event.key === 'ArrowDown' ? 1 : -1)),
        );
        this.update(input.value);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const result = this.results[this.activeIndex];
        if (result) this.select(result);
      }
    });
    this.querySelector('button')!.setAttribute('aria-expanded', 'true');
    this.update('');
    input.focus();
  }

  private close() {
    this.overlay?.remove();
    this.overlay = undefined;
    this.querySelector('button')?.setAttribute('aria-expanded', 'false');
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
    this.previousFocus = null;
  }

  private select(result: SearchResult) {
    this.close();
    this.navigate?.(result.section, result.filterQuery);
  }

  private update(query: string) {
    const list = this.overlay!.querySelector('ul')!;
    this.results = searchAdmin(query);
    list.replaceChildren();
    if (!this.results.length) {
      const empty = document.createElement('li');
      empty.className = 'px-3 py-8 text-center text-sm text-[var(--admin-muted)]';
      empty.textContent = 'No results for “' + query + '”';
      list.append(empty);
    }
    this.results.forEach((result, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className =
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ' +
        (index === this.activeIndex ? 'bg-[var(--admin-accent)]/10' : 'hover:bg-[var(--admin-accent)]/5');
      const type = document.createElement('span');
      type.className =
        'shrink-0 rounded-md bg-[var(--admin-elevated)] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[var(--admin-muted)]';
      type.textContent = searchTypeLabels[result.type] ?? 'Item';
      const text = document.createElement('span');
      text.className = 'min-w-0 flex-1';
      const title = document.createElement('span');
      title.className = 'block truncate text-sm text-[var(--admin-fg)]';
      title.textContent = result.title;
      text.append(title);
      if (result.subtitle) {
        const subtitle = document.createElement('span');
        subtitle.className = 'block truncate text-xs text-[var(--admin-muted)]';
        subtitle.textContent = result.subtitle;
        text.append(subtitle);
      }
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute(
        'class',
        'h-3.5 w-3.5 shrink-0 text-[var(--admin-muted)] transition-transform ' +
          (index === this.activeIndex ? 'translate-x-0.5 text-[var(--admin-fg)]' : ''),
      );
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', 'currentColor');
      arrow.setAttribute('stroke-width', '2');
      arrow.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 12h14 m-7-7 7 7-7 7');
      arrow.append(path);
      button.append(type, text, arrow);
      button.addEventListener('click', () => this.select(result));
      button.addEventListener('mouseenter', () => {
        this.activeIndex = index;
        for (const [position, element] of Array.from(list.querySelectorAll('button')).entries())
          element.classList.toggle('bg-[var(--admin-accent)]/10', position === index);
      });
      item.append(button);
      list.append(item);
    });
  }
}

customElements.define('pnd-header-search', HeaderSearch);
