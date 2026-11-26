export interface FieldValueState {
  label: string;
  value: unknown;
  change: (value: unknown) => void;
}

const controlClass =
  'w-full px-3 py-2 outline-none bg-[var(--admin-elevated)] text-[var(--admin-fg)] rounded-xl border-0 text-xs';

export class BotFieldValue extends HTMLElement {
  private current?: FieldValueState;
  private kind?: string;

  set state(state: FieldValueState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  connectedCallback() {
    this.style.display = 'block';
    this.update();
  }

  private update() {
    const state = this.current;
    if (!state) return;
    const { value, label } = state;
    let kind = Array.isArray(value) ? 'array' : typeof value;
    if (kind === 'string' && (String(value).length > 60 || this.kind === 'long')) kind = 'long';
    if (this.kind !== kind) {
      this.kind = kind;
      this.replaceChildren();
      if (kind === 'boolean') {
        this.innerHTML =
          '<div class="flex items-center justify-end gap-3 py-1"><span data-status class="text-xs font-medium text-[var(--admin-muted)] capitalize"></span><button type="button" role="switch"><span></span></button></div>';
        this.querySelector('button')!.addEventListener('click', () => this.current!.change(!this.current!.value));
      } else if (kind === 'array') {
        this.innerHTML = `<div class="w-full space-y-2"><div data-items class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-[var(--admin-elevated)]"></div><div class="flex items-center gap-2"><input class="${controlClass} h-9 flex-1" placeholder="Add item…"><button type="button" class="h-9 px-3 rounded-xl bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] text-xs font-semibold shrink-0 cursor-pointer">+ Add</button></div></div>`;
        const input = this.querySelector('input')!;
        const add = () => {
          const item = input.value.trim();
          if (!item) return;
          input.value = '';
          this.current!.change([...(this.current!.value as unknown[]), item]);
        };
        this.querySelector('button')!.addEventListener('click', add);
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            add();
          }
        });
      } else {
        const control = document.createElement(kind === 'long' ? 'textarea' : 'input');
        if (control instanceof HTMLTextAreaElement) control.rows = 3;
        else control.type = kind === 'number' ? 'number' : 'text';
        control.className = controlClass + (kind === 'long' ? ' resize-none leading-relaxed' : ' h-10');
        control.addEventListener('input', () =>
          this.current!.change(kind === 'number' ? Number(control.value) : control.value),
        );
        this.append(control);
      }
    }

    if (kind === 'boolean') {
      const button = this.querySelector('button')!;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-checked', String(value));
      button.className =
        'relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ' +
        (value ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]');
      button.firstElementChild!.className =
        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform bg-white shadow-sm ' +
        (value ? 'translate-x-5' : 'translate-x-0 opacity-60');
      this.querySelector('[data-status]')!.textContent = value ? 'Enabled' : 'Disabled';
    } else if (Array.isArray(value)) {
      this.querySelector('input')!.setAttribute('aria-label', 'Add item to ' + label);
      const items = this.querySelector('[data-items]')!;
      items.replaceChildren(
        ...value.map((item, index) => {
          const chip = document.createElement('span');
          chip.className =
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--admin-card)] text-xs font-medium text-[var(--admin-fg)]';
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'text-[var(--admin-muted)] hover:text-rose-400 transition-colors cursor-pointer';
          remove.setAttribute('aria-label', 'Remove item ' + (index + 1));
          remove.textContent = '×';
          remove.addEventListener('click', () =>
            this.current!.change((this.current!.value as unknown[]).filter((_, i) => i !== index)),
          );
          chip.append(String(item), remove);
          return chip;
        }),
      );
    } else {
      const control = this.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
      control.setAttribute('aria-label', label);
      const text = String(value ?? '');
      if (control !== document.activeElement || (kind !== 'number' && control.value !== text)) {
        if (control.value !== text) control.value = text;
      }
    }
  }
}

customElements.define('pnd-bot-field-value', BotFieldValue);
