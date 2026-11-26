export {};
type Mode = 'add' | 'remove' | 'set';
interface BalanceState {
  balance: number;
  apply: (mode: Mode, amount: number) => Promise<boolean>;
}

const template = document.createElement('template');
template.innerHTML = `
<div class="rounded-lg overflow-hidden">
  <div class="flex flex-col space-y-1.5 p-6 pb-3">
    <div class="flex items-center gap-2">
      <svg class="h-4 w-4 text-[var(--admin-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"></path><path d="M15 6h1v4"></path><path d="m6.134 14.768.866-.5 2 3.464"></path><circle cx="16" cy="8" r="6"></circle></svg>
      <h3 class="font-semibold tracking-tight text-sm text-[var(--admin-fg)]">Balance Management</h3>
    </div>
  </div>
  <div class="p-6 pt-0 space-y-4">
    <div class="rounded-lg bg-[var(--admin-elevated)] p-4 flex items-center justify-between">
      <span class="text-md font-medium text-[var(--admin-fg)]">Foils</span>
      <span data-balance class="text-xl font-bold tabular-nums text-[var(--admin-fg)] sm:text-2xl"></span>
    </div>
    <form class="space-y-3">
      <div class="inline-flex rounded-full bg-[var(--admin-elevated)] p-1">
        <button type="button" data-mode="add">+ Add</button><button type="button" data-mode="remove">- Remove</button><button type="button" data-mode="set">= Set</button>
      </div>
      <div class="space-y-1.5">
        <input type="number" min="0" max="999999999999" step="1" required aria-label="Balance amount" placeholder="Enter amount (whole number, max 12 digits)..." class="flex w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 h-9 text-xs bg-[var(--admin-elevated)] border-[var(--admin-border)] text-[var(--admin-fg)]">
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${[100, 1000, 10000, 100000].map((amount) => `<button type="button" data-amount="${amount}" class="rounded-full bg-[var(--admin-elevated)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors cursor-pointer">+${amount.toLocaleString()}</button>`).join('')}
        </div>
      </div>
      <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 px-4 py-2 w-full h-9 rounded-lg bg-[var(--admin-accent)] text-xs font-medium text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity"><svg data-spinner hidden class="mr-1.5 h-3.5 w-3.5 animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg><span>Apply Balance Change</span></button>
    </form>
  </div>
</div>`;

class PlayerBalance extends HTMLElement {
  private current?: BalanceState;
  private mode: Mode = 'add';
  private busy = false;

  set state(state: BalanceState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  connectedCallback() {
    this.style.display = 'block';
    if (!this.hasChildNodes()) {
      this.append(template.content.cloneNode(true));
      const input = this.querySelector('input')!;
      input.addEventListener('input', () => this.update());
      for (const button of this.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
        button.addEventListener('click', () => {
          this.mode = button.dataset.mode as Mode;
          this.update();
        });
      }
      for (const button of this.querySelectorAll<HTMLButtonElement>('[data-amount]')) {
        button.addEventListener('click', () => {
          input.value = button.dataset.amount!;
          this.update();
        });
      }
      this.querySelector('form')!.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (this.busy || !this.current || !input.reportValidity()) return;
        this.busy = true;
        this.update();
        try {
          if (await this.current.apply(this.mode, Number(input.value))) input.value = '';
        } finally {
          this.busy = false;
          this.update();
        }
      });
    }
    this.update();
  }

  private update() {
    this.querySelector('[data-balance]')!.textContent = this.current?.balance.toLocaleString() ?? '';
    const input = this.querySelector('input')!;
    input.disabled = this.busy;
    const submit = this.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.disabled = this.busy || !input.value;
    submit.querySelector('svg')!.toggleAttribute('hidden', !this.busy);
    submit.setAttribute('aria-busy', String(this.busy));
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      const active = this.mode === button.dataset.mode;
      button.disabled = this.busy;
      button.setAttribute('aria-pressed', String(active));
      button.className =
        'rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all cursor-pointer ' +
        (active
          ? 'bg-white text-black shadow-sm font-semibold'
          : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]');
    }
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-amount]')) button.disabled = this.busy;
  }
}

customElements.define('pnd-player-balance', PlayerBalance);
