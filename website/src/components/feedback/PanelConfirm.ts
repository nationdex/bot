import { panelMotionEnabled } from '@/lib/panel-animations';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export class PanelConfirm extends HTMLElement {
  private dialog = document.createElement('dialog');
  private state?: ConfirmModalProps;
  private headingText = document.createElement('h3');
  private description = document.createElement('p');
  private cancel = document.createElement('button');
  private confirm = document.createElement('button');
  private label = document.createElement('span');
  private spinner = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  constructor() {
    super();
    const id = crypto.randomUUID();
    this.headingText.id = 'confirm-title-' + id;
    this.description.id = 'confirm-description-' + id;
    this.dialog.setAttribute('aria-labelledby', this.headingText.id);
    this.dialog.setAttribute('aria-describedby', this.description.id);
    this.dialog.className = 'max-w-sm w-full border-0 p-0 bg-transparent text-[var(--admin-fg)] backdrop:bg-black/60';
    const panel = document.createElement('div');
    panel.className =
      'relative z-10 w-full max-w-sm rounded-2xl bg-[var(--admin-card)] text-[var(--admin-fg)] p-6 shadow-2xl space-y-4';
    const heading = document.createElement('div');
    heading.className = 'flex items-start gap-4';
    const text = document.createElement('div');
    text.className = 'space-y-1.5 min-w-0';
    this.headingText.className = 'text-base sm:text-lg font-bold text-[var(--admin-fg)] tracking-tight';
    this.description.className = 'text-xs sm:text-sm text-[var(--admin-muted)] leading-relaxed';
    text.append(this.headingText, this.description);
    heading.append(text);
    const actions = document.createElement('div');
    actions.className = 'flex items-center justify-end gap-2.5 pt-2';
    this.cancel.type = this.confirm.type = 'button';
    this.cancel.autofocus = true;
    this.cancel.className =
      'px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:opacity-80 transition-colors cursor-pointer disabled:opacity-50';
    this.spinner.setAttribute('viewBox', '0 0 24 24');
    this.spinner.setAttribute('fill', 'none');
    this.spinner.setAttribute('stroke', 'currentColor');
    this.spinner.setAttribute('stroke-width', '2');
    this.spinner.setAttribute('class', 'h-3.5 w-3.5 animate-spin');
    this.spinner.setAttribute('aria-hidden', 'true');
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('d', 'M12 2a10 10 0 1 0 10 10');
    this.spinner.append(arc);
    this.confirm.append(this.spinner, this.label);
    actions.append(this.cancel, this.confirm);
    panel.append(heading, actions);
    this.dialog.append(panel);
    this.cancel.addEventListener('click', () => this.closeRequest());
    this.confirm.addEventListener('click', () => {
      if (!this.state?.isLoading) void this.state?.onConfirm();
    });
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeRequest();
    });
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.closeRequest();
    });
  }

  connectedCallback() {
    document.body.append(this.dialog);
  }

  disconnectedCallback() {
    this.dialog.close();
    this.dialog.remove();
  }

  private closeRequest() {
    if (!this.state?.isLoading) this.state?.onClose();
  }

  update(state: ConfirmModalProps) {
    const opening = state.open && !this.dialog.open;
    this.state = state;
    this.headingText.textContent = state.title;
    this.description.textContent = state.description;
    this.cancel.textContent = state.cancelText ?? 'Cancel';
    this.label.textContent = state.confirmText ?? 'Delete';
    this.cancel.disabled = this.confirm.disabled = !!state.isLoading;
    this.spinner.style.display = state.isLoading ? '' : 'none';
    this.confirm.className =
      'px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ' +
      ((state.isDanger ?? true)
        ? 'bg-[#ff453a] text-white hover:bg-[#e03b32]'
        : 'bg-amber-500 text-black hover:bg-amber-400') +
      ' disabled:opacity-50';
    if (opening) {
      this.dialog.showModal();
      if (panelMotionEnabled('pageTransitions')) {
        this.dialog.firstElementChild!.animate(
          [
            { transform: 'translateY(12px) scale(.94)', opacity: 0 },
            { transform: 'translateY(0) scale(1)', opacity: 1 },
          ],
          { duration: 220, easing: 'ease-out' },
        );
      }
    } else if (!state.open && this.dialog.open) this.dialog.close();
  }
}

customElements.define('pnd-confirm', PanelConfirm);
