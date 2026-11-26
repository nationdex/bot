import { admin } from '@/lib/admin-classes';
import { cn } from '@/lib/utils';

// Chromium, Edge and Samsung Internet offer a real install prompt; Safari (iOS and macOS), Firefox and the rest
// install from their own menu, so those get written instructions instead of a button.
type InstallPrompt = Event & { prompt: () => Promise<void> };

const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay), (display-mode: minimal-ui)')
    .matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isApple = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const template = document.createElement('template');
template.innerHTML = `
  <div class="flex items-center justify-between gap-4 p-5">
    <div class="flex min-w-0 items-start gap-3">
      <svg class="${cn('mt-0.5 h-4 w-4 shrink-0', admin.muted)}" width="24" height="24"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 15V3"></path>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <path d="m7 10 5 5 5-5"></path>
      </svg>
      <div class="min-w-0">
        <h3 class="${cn('text-sm font-medium', admin.muted)}">Install app</h3>
        <p class="${cn('mt-1 text-xs', admin.muted)}"></p>
      </div>
    </div>
    <button type="button" class="shrink-0 cursor-pointer rounded-lg bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-medium text-[var(--admin-accent-fg)]">Install</button>
  </div>
`;

class InstallApp extends HTMLElement {
  private prompt: InstallPrompt | null = null;
  private installed = false;
  private readonly content = template.content.cloneNode(true) as DocumentFragment;
  private readonly message = this.content.querySelector('p')!;
  private readonly button = this.content.querySelector('button')!;

  connectedCallback() {
    this.className = cn('block rounded-lg', admin.card, 'overflow-hidden');
    if (!this.hasChildNodes()) {
      this.button.addEventListener('click', this.install);
      this.append(this.content);
    }
    this.installed = this.installed || isStandalone();
    window.addEventListener('beforeinstallprompt', this.onPrompt);
    window.addEventListener('appinstalled', this.onInstalled);
    this.update();
  }

  disconnectedCallback() {
    window.removeEventListener('beforeinstallprompt', this.onPrompt);
    window.removeEventListener('appinstalled', this.onInstalled);
  }

  private readonly onPrompt = (event: Event) => {
    event.preventDefault();
    this.prompt = event as InstallPrompt;
    this.update();
  };

  private readonly onInstalled = () => {
    this.installed = true;
    this.prompt = null;
    this.update();
  };

  private readonly install = async () => {
    const prompt = this.prompt;
    if (!prompt) return;
    this.button.disabled = true;
    try {
      await prompt.prompt();
    } catch {
      // The browser may expire a deferred prompt. Fall back to its menu instructions.
    } finally {
      if (this.prompt === prompt) this.prompt = null;
      this.button.disabled = false;
      this.update();
    }
  };

  private update() {
    let text: string;
    if (this.installed) text = 'You are using the installed app.';
    else if (!window.isSecureContext)
      text = 'Installing needs HTTPS (or localhost). Open the panel through a secure address to install it.';
    else if (this.prompt) text = 'Install the panel as an app with its own window and icon.';
    else if (isApple()) text = 'In Safari, tap Share, then "Add to Home Screen" (on a Mac: File, then "Add to Dock").';
    else text = 'Use your browser menu: "Install app" or "Add to Home screen".';
    this.message.textContent = text;
    this.button.hidden = this.installed || !this.prompt;
  }
}

customElements.define('pnd-install-app', InstallApp);
