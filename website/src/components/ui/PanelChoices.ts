export interface PanelChoicesState {
  options: readonly { id: string; label: string }[];
  active: string;
  select: (id: string) => void;
  appearance: 'dashboard' | 'player';
}

export class PanelChoices extends HTMLElement {
  private current?: PanelChoicesState;
  private buttons = new Map<string, HTMLButtonElement>();
  private group = document.createElement('div');

  connectedCallback() {
    this.style.display = 'contents';
    this.append(this.group);
    this.update();
  }

  set state(state: PanelChoicesState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  private update() {
    const state = this.current;
    if (!state) return;
    const dashboard = state.appearance === 'dashboard';
    this.group.className = dashboard
      ? 'inline-flex items-center gap-1.5 p-1 rounded-full bg-[var(--admin-card)] w-fit flex-wrap'
      : 'inline-flex rounded-full bg-[var(--admin-card)] p-1';
    for (const [index, { id, label }] of state.options.entries()) {
      let button = this.buttons.get(id);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.addEventListener('click', () => this.current?.select(id));
        this.buttons.set(id, button);
      }
      const active = state.active === id;
      const muted = 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]';
      button.setAttribute('aria-pressed', String(active));
      if (dashboard) {
        button.className =
          'relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors flex items-center justify-center cursor-pointer select-none touch-manipulation ' +
          (active ? 'text-[var(--admin-accent-fg)]' : muted);
        const caption = document.createElement('span');
        caption.className = 'relative z-10';
        caption.textContent = label;
        button.replaceChildren(caption);
        if (active) {
          const highlight = document.createElement('span');
          highlight.className = 'absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0';
          button.prepend(highlight);
        }
      } else {
        button.className =
          'rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-all cursor-pointer ' +
          (active ? 'bg-white text-black shadow-sm font-semibold' : muted);
        button.textContent = label;
      }
      if (this.group.children[index] !== button) this.group.insertBefore(button, this.group.children[index] ?? null);
    }
    for (const [id, button] of this.buttons) {
      if (state.options.some((option) => option.id === id)) continue;
      button.remove();
      this.buttons.delete(id);
    }
  }
}

customElements.define('pnd-panel-choices', PanelChoices);
