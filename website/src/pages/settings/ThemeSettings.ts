import { admin } from '@/lib/admin-classes';
import {
  applyThemeToDocument,
  defaultDarkPalette,
  defaultLightPalette,
  defaultThemePrefs,
  loadThemePrefs,
  saveThemePrefs,
  type ThemePalette,
  type ThemeMode,
} from '@/lib/theme-prefs';
import { applyPresetToPrefs, presetShellBackground, themePresets } from '@/lib/theme-presets';

function palettesMatch(a: ThemePalette, b: ThemePalette): boolean {
  return (
    a.shell === b.shell &&
    a.sidebar === b.sidebar &&
    a.panel === b.panel &&
    a.card === b.card &&
    a.accent === b.accent &&
    a.gradientEnabled === b.gradientEnabled &&
    a.gradientFrom === b.gradientFrom &&
    a.gradientTo === b.gradientTo
  );
}

const surfaceFields = [
  { key: 'shell' as const, label: 'Page background' },
  { key: 'sidebar' as const, label: 'Sidebar' },
  { key: 'panel' as const, label: 'Main panel' },
  { key: 'card' as const, label: 'Cards' },
  { key: 'elevated' as const, label: 'Raised surfaces' },
  { key: 'border' as const, label: 'Dividers' },
];

const textFields = [
  { key: 'foreground' as const, label: 'Primary text' },
  { key: 'muted' as const, label: 'Secondary text', picker: false },
];

const template = document.createElement('template');
template.innerHTML = `
<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div><p class="text-sm font-medium ${admin.fg}">Color mode</p><p class="mt-0.5 text-xs ${admin.muted}">Which palette the panel uses right now</p></div>
    <div class="flex w-full sm:w-auto rounded-lg p-1 ${admin.elevated}">
      <button type="button" data-mode="dark">Dark</button><button type="button" data-mode="light">Light</button>
    </div>
  </div>
  <div><p class="text-sm font-medium ${admin.fg}">Presets</p><p data-preview-copy class="mt-0.5 text-xs ${admin.muted}"></p><div data-presets class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"></div></div>
  <div class="h-px bg-[color-mix(in_srgb,var(--admin-fg)_8%,transparent)]"></div>
  <div>
    <p data-custom-title class="text-sm font-medium ${admin.fg}"></p><p data-custom-copy class="mt-0.5 text-xs ${admin.muted}"></p>
    <div class="mt-4 space-y-5">
      <div data-preview class="h-20 rounded-xl"></div>
      <div>
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-medium uppercase tracking-wide ${admin.muted}">Surfaces</p>
          <button data-reset-palette type="button" class="inline-flex items-center gap-1 text-xs transition-colors ${admin.muted} ${admin.hoverRow} rounded-md px-2 py-1">${resetIcon('h-3 w-3')} Reset</button>
        </div>
        <div data-surfaces class="grid gap-3 sm:grid-cols-2"></div>
      </div>
      <div><p class="mb-3 text-xs font-medium uppercase tracking-wide ${admin.muted}">Text</p><div data-text class="grid gap-3 sm:grid-cols-2"></div></div>
      <div><p class="mb-3 text-xs font-medium uppercase tracking-wide ${admin.muted}">Accent</p><div data-accent></div></div>
      <div data-gradient-row class="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div class="w-full sm:max-w-md rounded-xl p-4 ${admin.elevated}">
          <div class="flex items-center justify-between gap-3">
            <div><p class="text-sm font-medium ${admin.fg}">Background gradient</p><p class="mt-0.5 text-xs ${admin.muted}">Optional wash behind the panel</p></div>
            <button type="button" data-gradient role="switch" aria-label="Background gradient"><span></span></button>
          </div>
          <button type="button" data-stops class="mt-3 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${admin.hoverRow} ${admin.muted}">Gradient stops
            <svg class="h-4 w-4 transition-transform" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <div data-gradient-inputs class="mt-3 space-y-3">
            <div data-stops-colors class="space-y-3"></div>
            <div><label for="grad-angle" class="text-xs ${admin.muted}"></label><input id="grad-angle" type="range" min="0" max="360" class="mt-2 w-full accent-[var(--admin-accent)]"></div>
          </div>
        </div>
        <button data-reset-all type="button" class="inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium leading-none transition-colors cursor-pointer select-none shrink-0 self-end sm:self-auto ${admin.muted} ${admin.hoverRow}">${resetIcon('h-3.5 w-3.5 shrink-0')} <span>Restore defaults</span></button>
      </div>
    </div>
  </div>
</div>`;

function resetIcon(classes: string) {
  return `<svg class="${classes}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16.5"></path><path d="M3 21v-4.5h4.5"></path></svg>`;
}

const preview = document.createElement('template');
preview.innerHTML = `
<div class="relative h-11 overflow-hidden rounded-lg">
  <div class="absolute inset-y-0 left-0 w-[26%] rounded-l-lg"></div>
  <div class="absolute inset-y-1 left-[30%] right-1 rounded-md">
    <div class="absolute left-1.5 top-1.5 h-1 w-6 rounded-sm opacity-80"></div>
    <div class="absolute bottom-1 left-1.5 right-1.5 h-3 rounded-sm"></div>
    <div class="absolute right-1 top-1 h-2 w-2 rounded-full"></div>
  </div>
</div>`;

type ColorKey = Exclude<keyof ThemePalette, 'gradientEnabled' | 'gradientAngle'>;

export class ThemeSettings extends HTMLElement {
  private prefs = loadThemePrefs();
  private gradientOpen = this.prefs[this.prefs.mode].gradientEnabled;
  private readonly swatches = new Map<ColorKey, { input: HTMLInputElement; sample: HTMLElement; value: HTMLElement }>();

  connectedCallback() {
    this.style.display = 'block';
    this.replaceChildren(template.content.cloneNode(true));
    this.swatches.clear();
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      button.addEventListener('click', () => {
        this.prefs = { ...this.prefs, mode: button.dataset.mode as ThemeMode };
        this.commit();
      });
    }
    for (const { key, label } of surfaceFields) this.swatch('[data-surfaces]', key, label);
    for (const { key, label, picker } of textFields) this.swatch('[data-text]', key, label, picker);
    this.swatch('[data-accent]', 'accent', 'Buttons and highlights');
    this.swatch('[data-stops-colors]', 'gradientFrom', 'Start color');
    this.swatch('[data-stops-colors]', 'gradientTo', 'End color');
    this.querySelector('[data-reset-palette]')!.addEventListener('click', () => {
      this.patch(this.prefs.mode === 'dark' ? defaultDarkPalette : defaultLightPalette);
    });
    this.querySelector('[data-reset-all]')!.addEventListener('click', () => {
      this.prefs = structuredClone(defaultThemePrefs);
      this.gradientOpen = false;
      this.commit();
    });
    this.querySelector('[data-gradient]')!.addEventListener('click', () => {
      const enabled = !this.prefs[this.prefs.mode].gradientEnabled;
      if (enabled) this.gradientOpen = true;
      this.patch({ gradientEnabled: enabled });
    });
    this.querySelector('[data-stops]')!.addEventListener('click', () => {
      this.gradientOpen = !this.gradientOpen;
      this.update();
    });
    const angle = this.querySelector<HTMLInputElement>('#grad-angle')!;
    angle.addEventListener('input', () => this.patch({ gradientAngle: Number(angle.value) }));
    this.update();
  }

  private swatch(selector: string, key: ColorKey, labelText: string, picker = true) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3';
    const left = document.createElement('label');
    left.className = 'relative shrink-0 cursor-pointer';
    const sample = document.createElement('span');
    sample.className = 'block h-8 w-8 rounded-lg ring-1 ring-[color-mix(in_srgb,var(--admin-fg)_10%,transparent)]';
    const input = document.createElement('input');
    input.type = picker ? 'color' : 'text';
    input.id = 'theme-' + key;
    input.className = picker
      ? 'sr-only'
      : 'flex w-full rounded-md border-0 outline-none ring-0 px-3 py-2 mt-0.5 h-8 text-xs ' + admin.input;
    input.addEventListener(picker ? 'input' : 'change', () => this.patch({ [key]: input.value }));
    const text = document.createElement('div');
    text.className = 'min-w-0 flex-1';
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.className = 'block text-xs ' + admin.muted;
    label.textContent = labelText;
    const value = document.createElement('p');
    value.className = 'truncate text-sm tabular-nums ' + admin.fg;
    left.append(sample);
    text.append(label);
    if (picker) {
      left.append(input);
      text.append(value);
    } else text.append(input);
    row.append(left, text);
    this.querySelector(selector)!.append(row);
    this.swatches.set(key, { input, sample, value });
  }

  private patch(patch: Partial<ThemePalette>) {
    const mode = this.prefs.mode;
    this.prefs = { ...this.prefs, [mode]: { ...this.prefs[mode], ...patch } };
    this.commit();
  }

  private commit() {
    saveThemePrefs(this.prefs);
    applyThemeToDocument(this.prefs);
    this.update();
  }

  private update() {
    const { mode, dark, light } = this.prefs;
    const palette = this.prefs[mode];
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      const active = button.dataset.mode === mode;
      button.className =
        'flex-1 sm:flex-none rounded-md px-4 py-1.5 text-sm capitalize transition-colors ' +
        (active ? admin.accentPill : admin.muted + ' ' + admin.hoverRow);
      button.setAttribute('aria-pressed', String(active));
    }
    this.querySelector('[data-preview-copy]')!.textContent = 'Pick a starting point. Preview shows ' + mode + ' mode.';
    this.querySelector('[data-custom-title]')!.textContent = 'Custom ' + mode + ' colors';
    this.querySelector('[data-custom-copy]')!.textContent =
      'Tweaks apply to ' + mode + ' mode only. Switch above to edit the other.';
    this.querySelector<HTMLElement>('[data-preview]')!.style.background = presetShellBackground(palette);
    const presets = this.querySelector('[data-presets]')!;
    themePresets.forEach((preset, index) => {
      let button = presets.children[index] as HTMLButtonElement | undefined;
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.append(preview.content.cloneNode(true));
        const label = document.createElement('div');
        label.className = 'mt-2.5 flex items-center justify-between gap-2';
        const title = document.createElement('span');
        title.className = 'text-sm font-medium ' + admin.fg;
        title.textContent = preset.name;
        label.append(title, document.createElement('span'));
        button.append(label);
        button.addEventListener('click', () => {
          this.prefs = applyPresetToPrefs(this.prefs, preset);
          this.commit();
        });
        presets.append(button);
      }
      const active = palettesMatch(preset.dark, dark) && palettesMatch(preset.light, light);
      button.className =
        'group w-full rounded-xl p-3 text-left transition-colors ' +
        (active ? 'bg-[color-mix(in_srgb,var(--admin-accent)_12%,var(--admin-elevated))]' : admin.hoverRow);
      button.setAttribute('aria-pressed', String(active));
      const mini = button.firstElementChild as HTMLElement;
      const theme = preset[mode];
      mini.style.background = presetShellBackground(theme);
      [theme.sidebar, theme.panel, theme.foreground, theme.card, theme.accent].forEach((color, i) => {
        mini.querySelectorAll<HTMLElement>('div')[i].style.background = color;
      });
      const badge = button.lastElementChild!.lastElementChild!;
      badge.className = active ? 'flex h-5 w-5 items-center justify-center rounded-full ' + admin.accent : 'flex gap-1';
      badge.replaceChildren();
      if (active)
        badge.innerHTML =
          '<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
      else
        for (const color of [preset.dark.accent, preset.light.accent]) {
          const dot = document.createElement('span');
          dot.className = 'h-2 w-2 rounded-full';
          dot.style.background = color;
          badge.append(dot);
        }
    });
    for (const [key, { input, value, sample }] of this.swatches) {
      const color = palette[key];
      const display = color.startsWith('#') ? color.slice(0, 7) : '#666666';
      if (input.type === 'color') {
        if (input.value !== display) input.value = display;
        sample.style.background = display;
        value.textContent = display;
      } else {
        if (input.value !== color) input.value = color;
        sample.style.background = color.startsWith('#') ? color : 'transparent';
      }
    }
    const enabled = palette.gradientEnabled;
    const expanded = enabled && this.gradientOpen;
    const toggle = this.querySelector<HTMLButtonElement>('[data-gradient]')!;
    toggle.setAttribute('aria-checked', String(enabled));
    toggle.className =
      'relative h-6 w-11 shrink-0 rounded-full transition-colors ' +
      (enabled ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]');
    toggle.firstElementChild!.className =
      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ' +
      (enabled ? 'translate-x-5 bg-[var(--admin-accent-fg)]' : 'translate-x-0 bg-[var(--admin-fg)] opacity-40');
    const stops = this.querySelector<HTMLButtonElement>('[data-stops]')!;
    stops.hidden = !enabled;
    stops.setAttribute('aria-expanded', String(expanded));
    stops.querySelector('svg')!.classList.toggle('rotate-180', expanded);
    this.querySelector<HTMLElement>('[data-gradient-inputs]')!.hidden = !expanded;
    const row = this.querySelector('[data-gradient-row]')!;
    row.classList.toggle('sm:items-start', expanded);
    row.classList.toggle('sm:items-center', !expanded);
    this.querySelector('[data-reset-all]')!.classList.toggle('sm:mt-3', expanded);
    this.querySelector<HTMLLabelElement>('label[for="grad-angle"]')!.textContent =
      'Angle | ' + palette.gradientAngle + '°';
    this.querySelector<HTMLInputElement>('#grad-angle')!.value = String(palette.gradientAngle);
  }
}

customElements.define('pnd-theme-settings', ThemeSettings);
