import { admin } from '@/lib/admin-classes';
import { cookiesBlocked, fetchAuthStatus, login, setupPassword, type PanelUser } from '@/lib/auth';
import { bot } from '@/lib/bot';

const inputClass = `flex h-10 w-full rounded-md border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 bg-[var(--admin-elevated)] text-[var(--admin-fg)] ${admin.input}`;
const labelClass = `mb-1.5 block text-xs font-medium ${admin.muted}`;
const template = document.createElement('template');
// Only project-owned style constants appear in this template. User text goes through textContent.
template.innerHTML = `
  <div class="w-full max-w-sm rounded-2xl p-6 ${admin.panel}">
    <div class="mb-6 flex items-center gap-3">
      <img src="/logo.png" alt="" width="36" height="36" class="h-9 w-9 shrink-0 object-contain">
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold ${admin.fg}"></h1>
        <p data-subtitle class="text-xs ${admin.muted}">Panel sign in</p>
      </div>
    </div>
    <p data-loading class="text-sm ${admin.muted}">Loading...</p>
    <form class="space-y-4" hidden>
      <p data-cookies class="rounded-lg px-3 py-2 text-xs ${admin.elevated} ${admin.muted}" hidden>Cookies are blocked in this browser. You can still sign in, but the session lasts only until you reload or close this tab.</p>
      <div data-discord hidden>
        <a href="/api/auth/discord/start" class="block rounded-lg px-4 py-2 text-center text-sm font-medium ${admin.elevated} ${admin.fg}">Continue with Discord</a>
      </div>
      <div>
        <label for="admin-username" class="${labelClass}">Username</label>
        <input id="admin-username" type="text" value="admin" class="${inputClass}" autocomplete="username" required>
      </div>
      <div>
        <label for="admin-password" class="${labelClass}">Password</label>
        <input id="admin-password" type="password" class="${inputClass}" autocomplete="current-password" required minlength="4">
      </div>
      <p data-setup class="text-xs text-[var(--admin-muted)]" hidden>Initial setup: create your owner account credentials.</p>
      <p data-error class="text-xs text-rose-400 font-medium" role="alert" hidden></p>
      <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity">Sign in</button>
    </form>
  </div>
`;

class PanelLogin extends HTMLElement {
  complete?: (user?: PanelUser) => void;
  private initialized = false;

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.className = `flex h-full items-center justify-center overflow-y-auto p-4 ${admin.shell}`;
    this.append(template.content.cloneNode(true));
    this.querySelector('h1')!.textContent = bot.name;
    void this.initializeForm();
  }

  private async initializeForm() {
    const form = this.querySelector('form')!;
    const loading = this.querySelector<HTMLElement>('[data-loading]')!;
    const error = this.querySelector<HTMLElement>('[data-error]')!;
    const username = form.querySelector<HTMLInputElement>('#admin-username')!;
    const password = form.querySelector<HTMLInputElement>('#admin-password')!;
    const submit = form.querySelector('button')!;
    const setError = (message: string) => {
      error.textContent = message;
      error.hidden = !message;
    };
    if (new URLSearchParams(location.search).has('discord_error')) {
      setError('Discord sign-in failed or this account is not allowed.');
      history.replaceState(null, '', location.pathname);
    }

    let needsSetup = false;
    let discordEnabled = false;
    try {
      const status = await fetchAuthStatus();
      needsSetup = status.needsSetup;
      discordEnabled = !!status.discordEnabled;
    } catch {
      setError('Could not check sign-in status. Reload the page to try again.');
    }
    const blocked = cookiesBlocked();
    form.querySelector<HTMLElement>('[data-cookies]')!.hidden = !blocked;
    form.querySelector<HTMLElement>('[data-discord]')!.hidden = !discordEnabled || blocked;
    if (needsSetup) {
      this.querySelector('[data-subtitle]')!.textContent = 'Create panel owner account';
      form.querySelector<HTMLElement>('[data-setup]')!.hidden = false;
      password.autocomplete = 'new-password';
      submit.textContent = 'Create owner account';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      setError('');
      submit.disabled = true;
      try {
        const result = needsSetup
          ? await setupPassword(password.value, username.value, 'Panel Owner')
          : await login(password.value, username.value);
        if (result.ok) this.complete?.(result.user);
        else setError(result.error ?? 'Sign in failed.');
      } catch {
        setError('Sign in failed. Please try again.');
      } finally {
        submit.disabled = false;
      }
    });

    loading.hidden = true;
    form.hidden = false;
  }
}

customElements.define('pnd-panel-login', PanelLogin);
