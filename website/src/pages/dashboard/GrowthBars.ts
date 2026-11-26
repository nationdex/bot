interface GrowthBarsState {
  bars: readonly { label: string; count: number; unit: string; pct?: string; numGrowth: number }[];
  active: number;
  title: string;
  range: 'Month' | 'Annually';
  onRange: (range: 'Month' | 'Annually') => void;
  loading: boolean;
  animate: boolean;
}

export class GrowthBars extends HTMLElement {
  private current?: GrowthBarsState;
  private signature = '';
  private hovered: number | null = null;
  private nodes: HTMLElement[] = [];
  private readonly layout = document.createElement('template');

  constructor() {
    super();
    this.layout.innerHTML = `
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 class="text-sm font-medium text-[var(--admin-muted)]"></h3>
        <div class="relative z-20 inline-flex items-center gap-1 p-1 rounded-full bg-[var(--admin-elevated)] w-full sm:w-auto">
          ${(['Month', 'Annually'] as const).map((range) => `<button type="button" data-range="${range}"><span data-highlight class="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"></span><span class="relative z-10">${range}</span></button>`).join('')}
        </div>
      </div>
      <div data-loading style="display:contents">
                    <div class="my-2 p-3 rounded-lg bg-[var(--admin-elevated)] flex items-center justify-between animate-pulse">
                      <div class="space-y-1.5">
                        <div class="h-2.5 w-24 rounded bg-[var(--admin-card)]"></div>
                        <div class="h-5 w-32 rounded bg-[var(--admin-card)]"></div>
                      </div>
                      <div class="h-6 w-14 rounded-full bg-[var(--admin-card)]"></div>
                    </div>

                    <div class="flex-1 flex flex-col justify-end pt-3 pb-0 animate-pulse">
                      <div class="flex-1 w-full flex items-end justify-between gap-4 px-3 border-b border-[var(--admin-border)] min-h-[140px]">
                        <div class="flex-1 flex flex-col items-center h-full justify-end">
                          <div class="w-full max-w-[52px] h-[35%] rounded-t bg-[var(--admin-elevated)]"></div>
                        </div>
                        <div class="flex-1 flex flex-col items-center h-full justify-end">
                          <div class="w-full max-w-[52px] h-[60%] rounded-t bg-[var(--admin-elevated)]"></div>
                        </div>
                        <div class="flex-1 flex flex-col items-center h-full justify-end">
                          <div class="w-full max-w-[52px] h-[85%] rounded-t bg-[var(--admin-elevated)]"></div>
                        </div>
                      </div>

                      <div class="flex justify-between gap-4 px-3 pt-2 text-xs font-medium text-center">
                        <div class="flex-1 flex justify-center">
                          <div class="h-3 w-8 rounded bg-[var(--admin-elevated)]"></div>
                        </div>
                        <div class="flex-1 flex justify-center">
                          <div class="h-3 w-8 rounded bg-[var(--admin-elevated)]"></div>
                        </div>
                        <div class="flex-1 flex justify-center">
                          <div class="h-3 w-8 rounded bg-[var(--admin-elevated)]"></div>
                        </div>
                      </div>
                    </div>

      </div>
      <div data-loaded style="display:contents">
      <div data-summary class="my-2 p-3 rounded-lg bg-[var(--admin-elevated)] flex items-center justify-between">
        <div><p data-rate class="text-[11px] text-[var(--admin-muted)] font-medium"></p>
          <p data-count class="text-sm sm:text-base font-bold text-[var(--admin-fg)] mt-0.5"></p></div>
        <div data-change class="text-xs font-semibold px-2.5 py-1 rounded-full"></div>
      </div>
      <div class="flex-1 flex flex-col justify-end pt-3 pb-0">
        <div data-bars class="flex-1 w-full flex items-end justify-between gap-4 px-3 border-b border-[var(--admin-border)] min-h-[140px]"></div>
        <div data-labels class="flex justify-between gap-4 px-3 pt-2 text-xs font-medium text-center"></div>
      </div>
      </div>`;
  }

  connectedCallback() {
    this.style.display = 'contents';
    if (!this.hasChildNodes()) {
      this.append(this.layout.content.cloneNode(true));
      for (const button of this.querySelectorAll<HTMLButtonElement>('[data-range]')) {
        button.addEventListener('click', () => this.current?.onRange(button.dataset.range as GrowthBarsState['range']));
      }
    }
    this.update();
  }

  set state(state: GrowthBarsState) {
    if (this.current?.range !== state.range || this.current?.title !== state.title || state.loading)
      this.hovered = null;
    this.current = state;
    if (this.isConnected && this.hasChildNodes()) this.update();
  }

  private setHover(index: number | null) {
    this.hovered = index;
    this.update();
  }

  private update() {
    const state = this.current;
    if (!state) return;
    this.querySelector('h3')!.textContent = state.title;
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-range]')) {
      const selected = button.dataset.range === state.range;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector<HTMLElement>('[data-highlight]')!.hidden = !selected;
      button.className =
        'relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-1 sm:flex-none flex items-center justify-center cursor-pointer select-none touch-manipulation ' +
        (selected ? 'text-[var(--admin-accent-fg)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]');
    }
    this.querySelector<HTMLElement>('[data-loading]')!.style.display = state.loading ? 'contents' : 'none';
    this.querySelector<HTMLElement>('[data-loaded]')!.style.display = state.loading ? 'none' : 'contents';
    if (state.loading) return;
    const activeIndex = this.hovered ?? state.active;
    const item = state.bars[activeIndex] ?? state.bars.at(-1);
    this.querySelector('[data-rate]')!.textContent = item?.label ? item.label + ' Growth Rate' : 'Growth Rate';
    this.querySelector('[data-count]')!.textContent = item
      ? item.count.toLocaleString() + ' ' + item.unit
      : '0 Catches';
    const change = this.querySelector<HTMLElement>('[data-change]')!;
    change.hidden = !item?.pct;
    change.textContent = item?.pct ?? '';
    change.className =
      'text-xs font-semibold px-2.5 py-1 rounded-full ' +
      ((item?.numGrowth ?? 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400');
    const signature = JSON.stringify(state.bars);
    if (this.signature !== signature) {
      this.signature = signature;
      const max = Math.max(1, ...state.bars.map((bar) => bar.count));
      this.nodes = state.bars.map((item, index) => {
        const column = document.createElement('div');
        column.className = 'flex-1 flex flex-col items-center h-full justify-end cursor-pointer';
        column.addEventListener('mouseenter', () => this.setHover(index));
        column.addEventListener('mouseleave', () => this.setHover(null));
        column.addEventListener('touchstart', () => this.setHover(index), { passive: true });
        const track = document.createElement('div');
        track.className = 'w-full max-w-[52px] flex items-end justify-center h-full';
        const bar = document.createElement('div');
        const height = Math.max(12, Math.min(100, Math.round((item.count / max) * 100))) + '%';
        bar.style.height = height;
        if (state.animate)
          bar.animate([{ height: '0%' }, { height }], { duration: 180, delay: 100 + index * 60, fill: 'backwards' });
        const tip = document.createElement('div');
        tip.className =
          'absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs font-semibold px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-30 flex items-center gap-1.5 border border-[var(--admin-border)]';
        const label = document.createElement('span');
        label.textContent = item.count.toLocaleString() + ' ' + item.unit;
        tip.append(label);
        if (item.pct) {
          const change = document.createElement('span');
          change.className = item.numGrowth >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium';
          change.textContent = '(' + item.pct + ')';
          tip.append(change);
        }
        bar.append(tip);
        track.append(bar);
        column.append(track);
        return column;
      });
      this.querySelector('[data-bars]')!.replaceChildren(...this.nodes);
      this.querySelector('[data-labels]')!.replaceChildren(
        ...state.bars.map((item) => {
          const label = document.createElement('div');
          label.textContent = item.label;
          return label;
        }),
      );
    }
    this.nodes.forEach((column, index) => {
      const bar = column.firstElementChild!.firstElementChild!;
      const hovered = this.hovered === index;
      const active = activeIndex === index;
      this.querySelector('[data-labels]')!.children[index].className =
        'flex-1 transition-colors duration-150 ' +
        (active ? 'text-[var(--admin-fg)] font-bold' : 'text-[var(--admin-muted)]');
      const color = active
        ? hovered
          ? 'bg-purple-400'
          : 'bg-purple-500'
        : hovered
          ? 'bg-[var(--admin-fg)]/20'
          : 'bg-[var(--admin-elevated)]';
      bar.className = 'w-full rounded-t relative transition-colors duration-150 ' + color;
      (bar.firstElementChild as HTMLElement).hidden = !hovered;
    });
  }
}

customElements.define('pnd-growth-bars', GrowthBars);
