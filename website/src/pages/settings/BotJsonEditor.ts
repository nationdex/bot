interface JsonEditorState {
  text: string;
  error: string | null;
  copied: boolean;
  onChange: (value: string) => void;
  onCopy: () => void;
}

const template = document.createElement('template');
template.innerHTML = `
<div class="space-y-3">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2"><span data-status role="status"></span></div>
    <button type="button" class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 h-9 px-3 text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)] rounded-full">
      <svg class="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path></path></svg>
      <span data-label></span>
    </button>
  </div>
  <div class="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none overflow-hidden">
    <div class="p-4">
      <textarea name="jsontext" aria-label="Bot configuration JSON" rows="18" class="w-full text-xs bg-transparent text-[var(--admin-fg)] focus:outline-none resize-none leading-relaxed font-sans"></textarea>
    </div>
  </div>
</div>`;

export class BotJsonEditor extends HTMLElement {
  private current?: JsonEditorState;

  set state(state: JsonEditorState) {
    this.current = state;
    if (this.isConnected) this.update();
  }

  connectedCallback() {
    if (!this.hasChildNodes()) {
      this.append(template.content.cloneNode(true));
      const editor = this.querySelector('textarea')!;
      editor.addEventListener('input', () => this.current?.onChange(editor.value));
      this.querySelector('button')!.addEventListener('click', () => this.current?.onCopy());
    }
    this.update();
  }

  private update() {
    const state = this.current;
    if (!state) return;
    const editor = this.querySelector('textarea')!;
    if (editor.value !== state.text) editor.value = state.text;
    const status = this.querySelector<HTMLElement>('[data-status]')!;
    status.className =
      'text-xs font-semibold px-3 py-1 rounded-full ' +
      (state.error ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400');
    status.textContent = state.error || 'Valid JSON';
    this.querySelector('[data-label]')!.textContent = state.copied ? 'Copied' : 'Copy JSON';
    this.querySelector('svg')!.classList.toggle('text-emerald-400', state.copied);
    this.querySelector('path')!.setAttribute(
      'd',
      state.copied
        ? 'M20 6 9 17l-5-5'
        : 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2 M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z',
    );
  }
}

customElements.define('pnd-bot-json-editor', BotJsonEditor);
