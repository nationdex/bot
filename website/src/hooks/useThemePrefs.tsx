import { type ReactNode } from 'preact/compat';
import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { applyThemeToDocument, defaultDarkPalette, defaultLightPalette, defaultThemePrefs, getActivePalette, loadThemePrefs, saveThemePrefs, type ThemeMode, type ThemePalette, type ThemePrefs } from '@/lib/theme-prefs';
import { applyPresetToPrefs, type ThemePreset } from '@/lib/theme-presets';

type ThemePrefsContextValue = ThemePrefs & {
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  updateDark: (patch: Partial<ThemePalette>) => void;
  updateLight: (patch: Partial<ThemePalette>) => void;
  applyPreset: (preset: ThemePreset) => void;
  resetTheme: () => void;
  resetDarkPalette: () => void;
  resetLightPalette: () => void;
};

const ThemePrefsContext = createContext<ThemePrefsContextValue | null>(null);

export function ThemePrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePrefs>(loadThemePrefs);

  useEffect(() => {
    saveThemePrefs(prefs);
    applyThemeToDocument(prefs);
  }, [prefs]);

  const setMode = useCallback((mode: ThemeMode) => {
    setPrefs((current) => ({ ...current, mode }));
  }, []);

  const updateDark = useCallback((patch: Partial<ThemePalette>) => {
    setPrefs((current) => ({ ...current, dark: { ...current.dark, ...patch } }));
  }, []);

  const updateLight = useCallback((patch: Partial<ThemePalette>) => {
    setPrefs((current) => ({ ...current, light: { ...current.light, ...patch } }));
  }, []);

  const applyPreset = useCallback((preset: ThemePreset) => {
    setPrefs((current) => applyPresetToPrefs(current, preset));
  }, []);

  const resetTheme = useCallback(() => {
    setPrefs(defaultThemePrefs);
  }, []);

  const resetDarkPalette = useCallback(() => {
    setPrefs((current) => ({ ...current, dark: defaultDarkPalette }));
  }, []);

  const resetLightPalette = useCallback(() => {
    setPrefs((current) => ({ ...current, light: defaultLightPalette }));
  }, []);

  const value = useMemo(
    () => ({
      ...prefs,
      palette: getActivePalette(prefs),
      setMode,
      updateDark,
      updateLight,
      applyPreset,
      resetTheme,
      resetDarkPalette,
      resetLightPalette,
    }),
    [
      prefs,
      applyPreset,
      resetDarkPalette,
      resetLightPalette,
      resetTheme,
      setMode,
      updateDark,
      updateLight,
    ]
  );

  return <ThemePrefsContext.Provider value={value}>{children}</ThemePrefsContext.Provider>;
}

export function useThemePrefs() {
  const context = useContext(ThemePrefsContext);
  if (!context) {
    throw new Error('useThemePrefs must be used within ThemePrefsProvider');
  }
  return context;
}