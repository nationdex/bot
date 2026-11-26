export interface SectionOption {
  id: string;
  label: string;
}

interface DialogState {
  open: boolean;
  onClose: () => void;
  onAdd: (section: string, name: string, key: string, value: unknown) => void;
  availableSections: SectionOption[];
  defaultSection?: string;
}

const inputClass =
  'flex w-full h-10 px-3 py-2 outline-none bg-[var(--admin-elevated)] text-[var(--admin-fg)] rounded-xl border-0 text-xs';
const labelClass = 'text-xs font-medium text-[var(--admin-muted)]';
const template = document.createElement('template');
template.innerHTML = `
<dialog aria-labelledby="new-field-title" class="w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm">
  <div class="w-full bg-[var(--admin-panel)] rounded-2xl p-6 space-y-5 shadow-2xl">
    <div>
      <h3 id="new-field-title" class="text-base font-bold text-[var(--admin-fg)]">Add Setting Field</h3>
      <p class="text-xs text-[var(--admin-muted)] mt-0.5">Select a section and create a custom parameter</p>
    </div>
    <form class="space-y-4">
      <div class="space-y-1.5"><label for="new-field-section" class="${labelClass}">Target Section</label><select id="new-field-section" name="sectiontarget" class="${inputClass} cursor-pointer"></select></div>
      <div data-new-section class="space-y-1.5" hidden><label for="new-field-name" class="${labelClass}">New Section Name</label><input id="new-field-name" class="${inputClass}" placeholder="e.g. economy or discord"></div>
      <div class="space-y-1.5"><label for="new-field-key" class="${labelClass}">Field Key Name</label><input id="new-field-key" class="${inputClass}" placeholder="e.g. spawn_cooldown" autofocus required></div>
      <div class="space-y-1.5"><span class="${labelClass}">Data Type</span>
        <div class="grid grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-[var(--admin-elevated)]">
          ${['string', 'number', 'boolean', 'array'].map((type) => `<button type="button" data-type="${type}" class="py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer">${type}</button>`).join('')}
        </div>
      </div>
      <div class="space-y-1.5"><label for="new-field-value" class="${labelClass}">Initial Value</label>
        <input id="new-field-value" data-value class="${inputClass}" placeholder="Enter value">
        <select aria-label="Initial Value" data-boolean class="${inputClass} cursor-pointer" hidden><option value="true">Enabled (true)</option><option value="false">Disabled (false)</option></select>
      </div>
      <div class="flex justify-end gap-2 pt-3">
        <button type="button" data-cancel class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors h-9 px-3 text-xs rounded-xl text-[var(--admin-fg)]">Cancel</button>
        <button type="submit" class="px-5 py-2 text-xs font-semibold rounded-xl bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] transition-colors cursor-pointer">Add Field</button>
      </div>
    </form>
  </div>
</dialog>`;

export class NewFieldDialog extends HTMLElement {
  private dialog = template.content.firstElementChild!.cloneNode(true) as HTMLDialogElement;
  private form = this.dialog.querySelector('form')!;
  private section = this.dialog.querySelector<HTMLSelectElement>('[name="sectiontarget"]')!;
  private nameInput = this.dialog.querySelector<HTMLInputElement>('#new-field-name')!;
  private keyInput = this.dialog.querySelector<HTMLInputElement>('#new-field-key')!;
  private valueInput = this.dialog.querySelector<HTMLInputElement>('[data-value]')!;
  private booleanInput = this.dialog.querySelector<HTMLSelectElement>('[data-boolean]')!;
  private current?: DialogState;
  private fieldType = 'string';

  constructor() {
    super();
    this.section.addEventListener('change', () => this.updateSection());
    this.dialog.querySelector('[data-cancel]')!.addEventListener('click', () => this.current?.onClose());
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.current?.onClose();
    });
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.current?.onClose();
    });
    for (const button of this.dialog.querySelectorAll<HTMLButtonElement>('[data-type]')) {
      button.addEventListener('click', () => this.setType(button.dataset.type!));
    }
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const key = this.keyInput.value.trim();
      const name = this.nameInput.value.trim();
      if (!key || (this.section.value === '__new__' && !name)) return;
      const raw = this.valueInput.value;
      const value =
        this.fieldType === 'boolean'
          ? this.booleanInput.value === 'true'
          : this.fieldType === 'number'
            ? Number(raw) || 0
            : this.fieldType === 'array'
              ? raw
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
              : raw;
      this.current?.onAdd(this.section.value, name, key, value);
      this.current?.onClose();
    });
  }

  set state(state: DialogState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  connectedCallback() {
    document.body.append(this.dialog);
    this.update();
  }

  disconnectedCallback() {
    this.dialog.close();
    this.dialog.remove();
  }

  private update() {
    if (!this.current?.open) {
      this.dialog.close();
      return;
    }
    if (this.dialog.open) return;
    this.form.reset();
    this.section.replaceChildren(
      ...this.current.availableSections.map((section) => new Option(section.label, section.id)),
      new Option('+ Create New Section…', '__new__'),
    );
    const target = this.current.defaultSection || 'general';
    if (Array.from(this.section.options).some((option) => option.value === target)) this.section.value = target;
    this.updateSection();
    this.setType('string');
    this.dialog.showModal();
  }

  private updateSection() {
    const creating = this.section.value === '__new__';
    this.nameInput.required = creating;
    this.nameInput.parentElement!.hidden = !creating;
  }

  private setType(type: string) {
    this.fieldType = type;
    this.valueInput.type = type === 'number' ? 'number' : 'text';
    this.valueInput.value = '';
    this.valueInput.hidden = type === 'boolean';
    this.valueInput.placeholder = type === 'array' ? 'Comma separated values (e.g. common, rare)' : 'Enter value';
    this.booleanInput.hidden = type !== 'boolean';
    this.booleanInput.value = 'true';
    for (const button of this.dialog.querySelectorAll<HTMLButtonElement>('[data-type]')) {
      const active = button.dataset.type === type;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('bg-[var(--admin-accent)]', active);
      button.classList.toggle('text-[var(--admin-accent-fg)]', active);
      button.classList.toggle('text-[var(--admin-muted)]', !active);
      button.classList.toggle('hover:text-[var(--admin-fg)]', !active);
    }
  }
}

customElements.define('pnd-new-field-dialog', NewFieldDialog);
