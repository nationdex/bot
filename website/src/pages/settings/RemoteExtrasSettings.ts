import { admin } from '@/lib/admin-classes';
import { cn } from '@/lib/utils';

type Settings = {
  enabled: boolean;
  allowedOrigins: string[];
  catalogue: Array<{ id: string; repository: string; ref: string; path?: string }>;
};
const defaults: Settings = { enabled: false, allowedOrigins: ['https://extras.nationdex.com'], catalogue: [] };
const field = cn(
  'w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm',
  admin.fg,
);
const action = cn('rounded-lg px-3 py-2 text-sm disabled:opacity-50', admin.fg);

const template = document.createElement('template');
template.innerHTML = `
<form class="space-y-4">
 <fieldset class="space-y-4 min-w-0 border-0 p-0 m-0">
  <label class="flex items-start gap-3 text-sm font-medium ${admin.fg}"><input name="enabled" type="checkbox" class="mt-1 h-4 w-4">Enable remote extras management</label>
  <p class="text-xs ${admin.muted}">Approved extras execute with the bot's privileges. Review their source before approval.</p>
  <div class="space-y-2"><h4 class="text-sm font-medium ${admin.fg}">Allowed websites</h4><div data-origins class="space-y-2"></div><button data-add-origin type="button" class="${action}">Add website</button></div>
  <div class="space-y-3"><h4 class="text-sm font-medium ${admin.fg}">Approved extras</h4><div data-catalogue class="space-y-3"></div><button data-add-extra type="button" class="${action}">Add approved extra</button></div>
  <button type="submit" class="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-[var(--admin-accent-fg)] disabled:opacity-50">Save extras settings</button>
 </fieldset>
 <p role="status" class="text-sm ${admin.muted}"></p>
 <button data-retry hidden type="button" class="${action}">Retry loading settings</button>
</form>`;

export class RemoteExtrasSettings extends HTMLElement {
  private settings = structuredClone(defaults);
  private status: 'loading' | 'ready' | 'error' = 'loading';
  private saving = false;
  private request?: AbortController;

  connectedCallback() {
    this.style.display = 'block';
    this.replaceChildren(template.content.cloneNode(true));
    this.querySelector('form')!.addEventListener('submit', (event) => void this.save(event));
    this.querySelector<HTMLInputElement>('[name="enabled"]')!.addEventListener('change', (event) => {
      this.settings.enabled = (event.currentTarget as HTMLInputElement).checked;
    });
    this.querySelector('[data-add-origin]')!.addEventListener('click', () => {
      if (this.settings.allowedOrigins.length >= 20) return;
      this.settings.allowedOrigins.push('');
      this.rows();
      this.querySelector('[data-origins]')!.lastElementChild?.querySelector('input')?.focus();
    });
    this.querySelector('[data-add-extra]')!.addEventListener('click', () => {
      if (this.settings.catalogue.length >= 100) return;
      this.settings.catalogue.push({ id: '', repository: '', ref: '' });
      this.rows();
      this.querySelector('[data-catalogue]')!.lastElementChild?.querySelector('input')?.focus();
    });
    this.querySelector('[data-retry]')!.addEventListener('click', () => void this.load());
    void this.load();
  }

  disconnectedCallback() {
    this.request?.abort();
  }

  private async load() {
    this.request?.abort();
    const controller = new AbortController();
    this.request = controller;
    this.status = 'loading';
    this.message('Loading settings…');
    this.refresh();
    try {
      const response = await fetch('/api/panel/extras/settings', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load settings.');
      if (controller.signal.aborted) return;
      this.settings = body;
      this.status = 'ready';
      this.message('');
      this.rows();
    } catch (error) {
      if (controller.signal.aborted) return;
      this.status = 'error';
      this.message(error instanceof Error ? error.message : 'Could not load settings.');
    } finally {
      if (!controller.signal.aborted) this.refresh();
    }
  }

  private message(text: string) {
    this.querySelector('[role="status"]')!.textContent = text;
  }

  private refresh() {
    this.querySelector('fieldset')!.disabled = this.status !== 'ready' || this.saving;
    this.querySelector<HTMLElement>('[data-retry]')!.hidden = this.status !== 'error';
    this.querySelector('[type="submit"]')!.textContent = this.saving ? 'Saving…' : 'Save extras settings';
    this.querySelector<HTMLButtonElement>('[data-add-origin]')!.disabled = this.settings.allowedOrigins.length >= 20;
    this.querySelector<HTMLButtonElement>('[data-add-extra]')!.disabled = this.settings.catalogue.length >= 100;
  }

  private field(label: string, value: string, change: (text: string) => void) {
    const wrapper = document.createElement('label');
    wrapper.className = 'block text-xs ' + admin.fg;
    const input = document.createElement('input');
    input.className = field;
    input.value = value;
    input.addEventListener('input', () => change(input.value));
    wrapper.append(label, input);
    return { wrapper, input };
  }

  private removeButton(text: string, label: string, run: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = action;
    button.textContent = text;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => {
      run();
      this.rows();
    });
    return button;
  }

  private rows() {
    this.querySelector<HTMLInputElement>('[name="enabled"]')!.checked = this.settings.enabled;
    this.querySelector('[data-origins]')!.replaceChildren(
      ...this.settings.allowedOrigins.map((origin, index) => {
        const row = document.createElement('div');
        row.className = 'flex items-end gap-2';
        const { wrapper, input } = this.field(
          'HTTPS origin ' + (index + 1),
          origin,
          (text) => (this.settings.allowedOrigins[index] = text),
        );
        wrapper.classList.add('flex-1');
        input.type = 'url';
        input.required = true;
        input.placeholder = 'https://extras.nationdex.com';
        row.append(
          wrapper,
          this.removeButton('Remove', 'Remove website ' + (index + 1), () =>
            this.settings.allowedOrigins.splice(index, 1),
          ),
        );
        return row;
      }),
    );
    this.querySelector('[data-catalogue]')!.replaceChildren(
      ...this.settings.catalogue.map((extra, index) => {
        const row = document.createElement('div');
        row.className = 'space-y-2 rounded-lg border border-[var(--admin-border)] p-3';
        const fields = [
          ['id', 'Extra ID', '', 64],
          ['repository', 'GitHub repository', 'owner/repository', 201],
          ['path', 'Folder within repository (optional)', 'Leave empty for repository root', 200],
          ['ref', 'Approved commit SHA', '', 40],
        ] as const;
        for (const [key, label, placeholder, maxLength] of fields) {
          const { wrapper, input } = this.field(label, extra[key] ?? '', (text) => {
            extra[key] = text;
            if (key === 'id')
              row.querySelector('button')?.setAttribute('aria-label', 'Remove approval ' + (text || index + 1));
          });
          input.required = key !== 'path';
          input.placeholder = placeholder;
          input.maxLength = maxLength;
          if (key === 'ref') input.classList.add('font-mono');
          row.append(wrapper);
        }
        row.append(
          this.removeButton('Remove approval', 'Remove approval ' + (extra.id || index + 1), () =>
            this.settings.catalogue.splice(index, 1),
          ),
        );
        return row;
      }),
    );
    this.refresh();
  }

  private async save(event: Event) {
    event.preventDefault();
    if (this.status !== 'ready' || this.saving) return;
    const origins = this.settings.allowedOrigins.map((origin) => origin.trim());
    const catalogue = this.settings.catalogue.map((extra) => ({
      id: extra.id.trim(),
      repository: extra.repository.trim(),
      ref: extra.ref.trim(),
      path: (extra.path ?? '').trim(),
    }));
    try {
      for (const origin of origins) {
        const url = new URL(origin);
        if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password)
          throw new Error('Website origins must be HTTPS addresses without a path.');
      }
      if (new Set(origins).size !== origins.length) throw new Error('Remove duplicate website origins.');
      for (const extra of catalogue) {
        if (
          extra.path &&
          (extra.path.length > 200 ||
            !extra.path
              .split('/')
              .every(
                (segment) =>
                  /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(segment) && !['.', '..', '.git'].includes(segment.toLowerCase()),
              ))
        )
          throw new Error(
            'Extra folders must be relative paths such as extras/my-extra, without dot segments or .git.',
          );
        if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(extra.id))
          throw new Error('Extra IDs use lowercase letters, numbers and hyphens.');
        if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(extra.repository))
          throw new Error('Repositories use owner/repository, for example nationdex/my-extra.');
        if (!/^[a-f0-9]{40}$/.test(extra.ref))
          throw new Error('Each extra needs its full lowercase 40-character commit SHA.');
      }
      if (new Set(catalogue.map((extra) => extra.id)).size !== catalogue.length)
        throw new Error('Extra IDs must be unique.');
      this.saving = true;
      this.refresh();
      this.message('');
      const response = await fetch('/api/panel/extras/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.settings, allowedOrigins: origins, catalogue }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save settings.');
      this.settings = body.settings;
      this.rows();
      this.message('Remote extras settings saved.');
    } catch (error) {
      this.message(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      this.saving = false;
      this.refresh();
    }
  }
}

customElements.define('pnd-remote-extras', RemoteExtrasSettings);
