export interface PaginationState {
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

const template = document.createElement('template');
template.innerHTML = `
<div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs text-[var(--admin-muted)]">
<div class="flex items-center gap-4 flex-wrap">
<div class="flex items-center gap-2">
<span>Rows per page:</span>
<select name="pagesize" aria-label="Rows per page" class="bg-[var(--admin-elevated)] text-[var(--admin-fg)] rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none cursor-pointer">
</select>
</div>
<span>Showing <strong class="text-[var(--admin-fg)] font-semibold" data-range>
</strong> of <strong class="text-[var(--admin-fg)] font-semibold" data-total>
</strong> entries</span>
</div>
<div class="flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-elevated)]">
<button type="button" disabled="" title="First Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m11 17-5-5 5-5">
</path>
<path d="m18 17-5-5 5-5">
</path>
</svg>
</button>
<button type="button" disabled="" title="Previous Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m15 18-6-6 6-6">
</path>
</svg>
</button>
<span class="px-2.5 text-xs font-semibold text-[var(--admin-fg)] select-none" data-page>
</span>
<button type="button" disabled="" title="Next Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m9 18 6-6-6-6">
</path>
</svg>
</button>
<button type="button" disabled="" title="Last Page" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none h-7 w-7 p-0 rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] disabled:opacity-40">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5">
<path d="m6 17 5-5-5-5">
</path>
<path d="m13 17 5-5-5-5">
</path>
</svg>
</button>
</div>
</div>
`;

const defaultSizes = [5, 10, 25, 50];

export class PanelPagination extends HTMLElement {
  private current?: PaginationState;
  private readonly content = template.content.firstElementChild!.cloneNode(true) as HTMLElement;

  connectedCallback() {
    this.style.display = 'contents';
    if (!this.hasChildNodes()) {
      this.append(this.content);
      const select = this.content.querySelector('select')!;
      select.addEventListener('change', () => {
        const state = this.current;
        if (!state) return;
        state.setPageSize(Number(select.value));
        state.setCurrentPage(1);
      });
      this.content.querySelectorAll('button').forEach((button, index) => {
        button.addEventListener('click', () => {
          const state = this.current;
          if (!state) return;
          const pages = Math.max(1, Math.ceil(state.totalItems / state.pageSize));
          const page = Math.max(1, Math.min(state.currentPage, pages));
          state.setCurrentPage([1, Math.max(1, page - 1), Math.min(pages, page + 1), pages][index]);
        });
      });
    }
    this.update();
  }

  set state(state: PaginationState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  private update() {
    const state = this.current;
    if (!state) return;
    const { totalItems, pageSize, currentPage, className } = state;
    const options = state.pageSizeOptions ?? defaultSizes;
    const pages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.max(1, Math.min(currentPage, pages));
    this.content.className =
      'flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] text-xs text-[var(--admin-muted)]' +
      (className ? ' ' + className : '');
    const select = this.content.querySelector('select')!;
    if (Array.from(select.options, (option) => Number(option.value)).join() !== options.join()) {
      select.replaceChildren(...options.map((value) => new Option(String(value), String(value))));
    }
    select.value = String(pageSize);
    const start = totalItems ? (page - 1) * pageSize + 1 : 0;
    this.content.querySelector('[data-range]')!.textContent = start + '–' + Math.min(page * pageSize, totalItems);
    this.content.querySelector('[data-total]')!.textContent = String(totalItems);
    this.content.querySelector('[data-page]')!.textContent = 'Page ' + page + ' of ' + pages;
    this.content.querySelectorAll('button').forEach((button, index) => {
      button.disabled = index < 2 ? page <= 1 : page >= pages;
    });
  }
}

customElements.define('pnd-panel-pagination', PanelPagination);
