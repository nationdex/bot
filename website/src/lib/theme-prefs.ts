export type ThemeMode = 'dark' | 'light';

export type ThemePalette = {
  shell: string;
  sidebar: string;
  panel: string;
  card: string;
  elevated: string;
  border: string;
  foreground: string;
  muted: string;
  accent: string;
  accentForeground: string;
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
};

export type ThemePrefs = {
  mode: ThemeMode;
  dark: ThemePalette;
  light: ThemePalette;
};

export const defaultDarkPalette: ThemePalette = {
  shell: '#0a0a0a',
  sidebar: '#121212',
  panel: '#0f0f0f',
  card: '#1a1a1a',
  elevated: '#252525',
  border: '#252525',
  foreground: '#fafafa',
  muted: 'rgba(255,255,255,0.5)',
  accent: '#ffffff',
  accentForeground: '#0f0f0f',
  gradientEnabled: false,
  gradientFrom: '#0a0a0a',
  gradientTo: '#121212',
  gradientAngle: 145,
};

export const defaultLightPalette: ThemePalette = {
  shell: '#f4f4f5',
  sidebar: '#ffffff',
  panel: '#ffffff',
  card: '#f9fafb',
  elevated: '#f4f4f5',
  border: '#e4e4e7',
  foreground: '#18181b',
  muted: 'rgba(24,24,27,0.55)',
  accent: '#18181b',
  accentForeground: '#fafafa',
  gradientEnabled: false,
  gradientFrom: '#f8fafc',
  gradientTo: '#e2e8f0',
  gradientAngle: 145,
};

export const defaultThemePrefs: ThemePrefs = {
  mode: 'dark',
  dark: defaultDarkPalette,
  light: defaultLightPalette,
};

const STORAGE_KEY = 'nationdex-admin-theme-prefs';

function mergePalette(base: ThemePalette, partial?: Partial<ThemePalette>): ThemePalette {
  if (!partial) return base;
  return {
    shell: partial.shell ?? base.shell,
    sidebar: partial.sidebar ?? base.sidebar,
    panel: partial.panel ?? base.panel,
    card: partial.card ?? base.card,
    elevated: partial.elevated ?? base.elevated,
    border: partial.border ?? base.border,
    foreground: partial.foreground ?? base.foreground,
    muted: partial.muted ?? base.muted,
    accent: partial.accent ?? base.accent,
    accentForeground: partial.accentForeground ?? base.accentForeground,
    gradientEnabled: partial.gradientEnabled ?? base.gradientEnabled,
    gradientFrom: partial.gradientFrom ?? base.gradientFrom,
    gradientTo: partial.gradientTo ?? base.gradientTo,
    gradientAngle: partial.gradientAngle ?? base.gradientAngle,
  };
}

export function loadThemePrefs(): ThemePrefs {
  if (typeof window === 'undefined') return defaultThemePrefs;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultThemePrefs;
    const parsed = JSON.parse(raw) as Partial<ThemePrefs>;
    return {
      mode: parsed.mode === 'light' ? 'light' : 'dark',
      dark: mergePalette(defaultDarkPalette, parsed.dark),
      light: mergePalette(defaultLightPalette, parsed.light),
    };
  } catch {
    return defaultThemePrefs;
  }
}

export function saveThemePrefs(prefs: ThemePrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function getActivePalette(prefs: ThemePrefs): ThemePalette {
  return prefs.mode === 'light' ? prefs.light : prefs.dark;
}

export function applyThemeToDocument(prefs: ThemePrefs) {
  if (typeof document === 'undefined') return;

  const palette = getActivePalette(prefs);
  const root = document.documentElement;

  root.dataset.theme = prefs.mode;

  root.style.setProperty('--admin-shell', palette.shell);
  root.style.setProperty('--admin-sidebar', palette.sidebar);
  root.style.setProperty('--admin-panel', palette.panel);
  root.style.setProperty('--admin-card', palette.card);
  root.style.setProperty('--admin-elevated', palette.elevated);
  root.style.setProperty('--admin-border', palette.border);
  root.style.setProperty('--admin-fg', palette.foreground);
  root.style.setProperty('--admin-muted', palette.muted);
  root.style.setProperty('--admin-accent', palette.accent);
  root.style.setProperty('--admin-accent-fg', palette.accentForeground);

  if (palette.gradientEnabled) {
    root.style.setProperty(
      '--admin-shell-bg',
      `linear-gradient(${palette.gradientAngle}deg, ${palette.gradientFrom}, ${palette.gradientTo})`
    );
  } else {
    root.style.setProperty('--admin-shell-bg', palette.shell);
  }

  document.body.style.background = palette.gradientEnabled
    ? `linear-gradient(${palette.gradientAngle}deg, ${palette.gradientFrom}, ${palette.gradientTo})`
    : palette.shell;
  document.body.style.color = palette.foreground;
}