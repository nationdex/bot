import { type ReactNode } from 'preact/compat';
import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import {
  type AnimationPrefs,
  applyAnimationPrefsToDocument,
  applyLowSpecAnimationPrefs,
  defaultAnimationPrefs,
  loadAnimationPrefs,
  normalizeAnimationPrefs,
  saveAnimationPrefs,
  type MotionPrefKey,
} from '@/lib/animation-prefs';

type AnimationPrefsContextValue = AnimationPrefs & {
  setPref: (key: MotionPrefKey | 'masterEnabled', value: boolean) => void;
  setMasterEnabled: (enabled: boolean) => void;
  applyLowSpecMode: () => void;
  resetAnimationPrefs: () => void;
};

const AnimationPrefsContext = createContext<AnimationPrefsContextValue | null>(null);

export function AnimationPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AnimationPrefs>(loadAnimationPrefs);

  useEffect(() => {
    saveAnimationPrefs(prefs);
    applyAnimationPrefsToDocument(prefs);
  }, [prefs]);

  const setPref = useCallback((key: MotionPrefKey | 'masterEnabled', value: boolean) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  }, []);

  const setMasterEnabled = useCallback((enabled: boolean) => {
    setPrefs((current) => ({ ...current, masterEnabled: enabled }));
  }, []);

  const applyLowSpecMode = useCallback(() => {
    setPrefs((current) => applyLowSpecAnimationPrefs(current));
  }, []);

  const resetAnimationPrefs = useCallback(() => {
    setPrefs(defaultAnimationPrefs);
  }, []);

  const value = useMemo(
    () => ({
      ...prefs,
      setPref,
      setMasterEnabled,
      applyLowSpecMode,
      resetAnimationPrefs,
    }),
    [prefs, resetAnimationPrefs, setMasterEnabled, applyLowSpecMode, setPref],
  );

  return <AnimationPrefsContext.Provider value={value}>{children}</AnimationPrefsContext.Provider>;
}

export function useAnimationPrefs() {
  const context = useContext(AnimationPrefsContext);
  if (!context) {
    throw new Error('useAnimationPrefs must be used within AnimationPrefsProvider');
  }
  return context;
}

export function useMotionPref(key: MotionPrefKey): boolean {
  const osReduced = useOsPrefersReducedMotion();
  const prefs = useAnimationPrefs();
  if (osReduced || !prefs.masterEnabled) return false;
  return prefs[key];
}

export function useOsPrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export { normalizeAnimationPrefs };
