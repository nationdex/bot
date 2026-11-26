export interface UnsavedChangesState {
  show: boolean;
  isSaving?: boolean;
  saveSuccess?: boolean;
  message?: string;
  onReset: () => void;
  onSave: () => void;
}

const template = document.createElement('template');
template.innerHTML = `
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[990] w-[min(calc(100vw-2rem),36rem)] rounded-xl bg-[var(--admin-elevated)]/95 text-[var(--admin-fg)] pl-4 pr-1 py-1 backdrop-blur-xl flex items-center justify-between gap-3 shadow-2xl" hidden>
  <div class="flex items-center gap-2 min-w-0"><span data-message class="text-xs sm:text-sm font-semibold truncate text-[var(--admin-fg)] tracking-tight"></span></div>
  <div class="inline-flex items-center p-1 gap-1.5 shrink-0">
    <button type="button" class="px-4 py-2 text-xs sm:text-sm font-semibold rounded-md text-[#ff453a] hover:underline decoration-red-500 underline-offset-4 transition-colors cursor-pointer disabled:opacity-50">Reset</button>
    <button type="button" class="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold rounded-md bg-[#1a642c] text-white hover:bg-[#1e7e34] transition-colors cursor-pointer disabled:opacity-50">
      <svg class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path></path></svg>
      <span data-label></span>
    </button>
  </div>
</div>`;

export class PanelUnsavedChanges extends HTMLElement {
  private bar = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  private buttons = this.bar.querySelectorAll('button');
  private state?: UnsavedChangesState;
  private animation?: Animation;

  constructor() {
    super();
    this.buttons[0].addEventListener('click', () => this.state?.onReset());
    this.buttons[1].addEventListener('click', () => this.state?.onSave());
  }

  connectedCallback() {
    document.body.append(this.bar);
  }

  disconnectedCallback() {
    this.animation?.cancel();
    this.bar.remove();
  }

  update(state: UnsavedChangesState) {
    const visibilityChanged = this.state?.show !== state.show;
    this.state = state;
    this.bar.querySelector('[data-message]')!.textContent = state.message ?? 'Careful, you have unsaved changes!';
    this.bar.querySelector('[data-label]')!.textContent = state.saveSuccess ? 'Saved!' : 'Save Changes';
    for (const button of this.buttons) button.disabled = !!state.isSaving;
    const icon = this.bar.querySelector('svg')!;
    icon.style.display = state.isSaving || state.saveSuccess ? '' : 'none';
    icon.classList.toggle('animate-spin', !!state.isSaving);
    icon
      .querySelector('path')!
      .setAttribute(
        'd',
        state.isSaving ? 'M20 7h-5V2 M4 17h5v5 M20 7a8 8 0 0 0-14-2 M4 17a8 8 0 0 0 14 2' : 'M20 6 9 17l-5-5',
      );

    if (!visibilityChanged) return;
    this.animation?.cancel();
    if (this.bar.hidden && !state.show) return;
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.animations === 'off'
    ) {
      this.bar.hidden = !state.show;
      return;
    }
    this.bar.hidden = false;
    const hidden = { opacity: 0, transform: 'translateY(80px) scale(.95)' };
    const visible = { opacity: 1, transform: 'translateY(0) scale(1)' };
    this.animation = this.bar.animate(state.show ? [hidden, visible] : [visible, hidden], {
      duration: 220,
      easing: 'ease-out',
    });
    if (!state.show)
      this.animation.onfinish = () => {
        this.bar.hidden = true;
      };
  }
}

customElements.define('pnd-unsaved-changes', PanelUnsavedChanges);
