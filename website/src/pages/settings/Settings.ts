import './ThemeSettings';
import './RemoteExtrasSettings';
import '@/components/layout/InstallApp';
import { admin } from '@/lib/admin-classes';
import {
  applyAnimationPrefsToDocument,
  applyLowSpecAnimationPrefs,
  defaultAnimationPrefs,
  loadAnimationPrefs,
  motionSettingGroups,
  saveAnimationPrefs,
  type AnimationPrefs,
} from '@/lib/animation-prefs';

const paths = {
  Palette:
    '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"></path><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>',
  Sparkles:
    '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle cx="4" cy="20" r="2"></circle>',
  ChevronRight: '<path d="m9 18 6-6-6-6"></path>',
  Gauge: '<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>',
  RotateCcw: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>',
  Monitor:
    '<rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line>',
};

const template = document.createElement('template');
template.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6">
  <pnd-install-app></pnd-install-app>
  <div data-extras hidden class="rounded-lg ${admin.card} overflow-hidden">
    <div class="p-5">
      <h3 class="text-sm font-medium ${admin.fg}">Remote extras</h3>
      <p class="mt-1 text-xs ${admin.muted}">Manage the allowlist used by the extras website. The bot's API token is issued separately through Discord and is never stored in these settings.</p>
    </div>
    <div data-form="extras" class="p-6 pt-0 px-5 pb-5"></div>
  </div>
  ${section('theme', 'Theme &amp; appearance', 'Palette')}
  ${section('motion', 'Motion &amp; effects', 'Sparkles')}
  <div class="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="inline-flex items-center gap-1 p-1 rounded-full bg-[var(--admin-card)] w-fit">
      ${action('low', 'Low spec mode', 'Gauge')}
      ${action('reset', 'Restore defaults', 'RotateCcw')}
    </div>
  </div>
</div>`;

function section(id: string, title: string, iconName: keyof typeof paths) {
  return `<div class="rounded-lg ${admin.card} overflow-hidden">
    <button type="button" data-toggle="${id}" aria-expanded="true" aria-controls="panel-settings-${id}" class="flex items-center gap-2 w-full p-5 text-left cursor-pointer select-none group">
      ${icon(iconName, 'h-4 w-4 shrink-0 ' + admin.muted)}
      <h3 class="text-sm font-medium transition-colors group-hover:text-[var(--admin-fg)] ${admin.muted}">${title}</h3>
      ${icon('ChevronRight', 'h-4 w-4 shrink-0 transition-transform duration-200 rotate-90 text-[var(--admin-fg)]')}
    </button>
    <div id="panel-settings-${id}" class="overflow-hidden"><div data-form="${id}" class="p-6 px-5 pb-5 pt-0${id === 'motion' ? ' space-y-6' : ''}"></div></div>
  </div>`;
}

function action(id: string, label: string, iconName: keyof typeof paths) {
  return `<button type="button" data-action="${id}" class="h-7 sm:h-8 px-3 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors shrink-0 ${admin.muted} ${admin.hoverRow}">${icon(iconName, 'h-3.5 w-3.5 shrink-0')}<span>${label}</span></button>`;
}

function icon(name: keyof typeof paths, classes: string) {
  return `<svg class="${classes}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

export class PanelSettings extends HTMLElement {
  isOwner = false;
  private prefs = loadAnimationPrefs();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private switches = new Map<keyof AnimationPrefs, HTMLButtonElement>();

  connectedCallback() {
    this.style.display = 'contents';
    this.replaceChildren(template.content.cloneNode(true));
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-toggle]')) {
      const panel = button.nextElementSibling as HTMLElement;
      button.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        const chevron = button.lastElementChild!;
        chevron.classList.toggle('rotate-90', !panel.hidden);
        chevron.classList.toggle(admin.fg, !panel.hidden);
        chevron.classList.toggle(admin.muted, panel.hidden);
      });
    }
    const motion = this.querySelector('[data-form="motion"]')!;
    motion.append(
      this.setting('masterEnabled', 'Enable motion', 'Master switch. Turn off to disable every effect below.'),
    );
    for (const group of motionSettingGroups) {
      const box = document.createElement('div');
      box.className = 'space-y-4';
      const title = document.createElement('p');
      title.className = 'text-xs font-medium uppercase tracking-wide ' + admin.muted;
      title.textContent = group.title;
      const controls = document.createElement('div');
      controls.className = 'space-y-4';
      for (const setting of group.settings)
        controls.append(this.setting(setting.key, setting.label, setting.description));
      box.append(title, controls);
      motion.append(box);
    }
    const warning = document.createElement('div');
    warning.dataset.reduced = '';
    warning.className = 'flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ' + admin.elevated + ' ' + admin.muted;
    warning.innerHTML =
      icon('Monitor', 'mt-0.5 h-3.5 w-3.5 shrink-0 ' + admin.muted) +
      `<p>System <strong class="${admin.fg}">Reduce motion</strong> is on. These toggles have no effect.</p>`;
    motion.append(warning);
    this.querySelector('[data-action="low"]')!.addEventListener('click', () =>
      this.save(applyLowSpecAnimationPrefs(this.prefs)),
    );
    this.querySelector('[data-action="reset"]')!.addEventListener('click', () => this.save(defaultAnimationPrefs));
    this.reduced.addEventListener('change', this.update);
    this.update();
    this.querySelector<HTMLElement>('[data-extras]')!.hidden = !this.isOwner;
    this.querySelector('[data-form="theme"]')!.append(document.createElement('pnd-theme-settings'));
    if (this.isOwner) this.querySelector('[data-form="extras"]')!.append(document.createElement('pnd-remote-extras'));
  }

  disconnectedCallback() {
    this.reduced.removeEventListener('change', this.update);
    this.switches.clear();
  }

  private setting(key: keyof AnimationPrefs, text: string, description: string) {
    const row = document.createElement('div');
    row.className = 'flex items-start justify-between gap-4';
    const info = document.createElement('div');
    info.className = 'min-w-0';
    const label = document.createElement('label');
    label.className = 'block text-sm font-medium ' + admin.fg;
    label.textContent = text;
    label.htmlFor = 'motion-' + (key === 'masterEnabled' ? 'master' : key);
    const detail = document.createElement('p');
    detail.className = 'mt-1 text-xs ' + admin.muted;
    detail.textContent = description;
    const button = document.createElement('button');
    button.id = label.htmlFor;
    button.type = 'button';
    button.setAttribute('role', 'switch');
    button.append(document.createElement('span'));
    button.addEventListener('click', () => this.save({ ...this.prefs, [key]: !this.prefs[key] }));
    info.append(label, detail);
    row.append(info, button);
    this.switches.set(key, button);
    return row;
  }

  private save(prefs: AnimationPrefs) {
    this.prefs = prefs;
    saveAnimationPrefs(prefs);
    applyAnimationPrefsToDocument(prefs);
    this.update();
  }

  private readonly update = () => {
    for (const [key, button] of this.switches) {
      const checked = this.prefs[key];
      button.disabled = this.reduced.matches || (key !== 'masterEnabled' && !this.prefs.masterEnabled);
      button.setAttribute('aria-checked', String(checked));
      button.className =
        'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ' +
        (checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]') +
        (button.disabled ? ' cursor-not-allowed opacity-50' : '');
      button.firstElementChild!.className =
        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ' +
        (checked ? 'translate-x-5 bg-[var(--admin-accent-fg)]' : 'translate-x-0 bg-[var(--admin-fg)] opacity-50');
    }
    const low = this.querySelector<HTMLButtonElement>('[data-action="low"]')!;
    low.disabled = this.reduced.matches || !this.prefs.masterEnabled;
    low.classList.toggle('opacity-50', low.disabled);
    low.classList.toggle('cursor-not-allowed', low.disabled);
    this.querySelector<HTMLElement>('[data-reduced]')!.hidden = !this.reduced.matches;
  };
}

customElements.define('pnd-panel-settings', PanelSettings);
