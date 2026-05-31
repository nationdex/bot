import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type AnimationPrefs,
  applyAnimationPrefsToDocument,
  defaultAnimationPrefs,
  loadAnimationPrefs,
  saveAnimationPrefs,
} from '@/lib/animation-prefs';

type AnimationPrefsContextValue = AnimationPrefs & {
  setAnimationsEnabled: (enabled: boolean) => void;
  setEnable3D: (enabled: boolean) => void;
  resetAnimationPrefs: () => void;
};

const AnimationPrefsContext = createContext<AnimationPrefsContextValue | null>(null);

export function AnimationPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AnimationPrefs>(loadAnimationPrefs);

  useEffect(() => {
    saveAnimationPrefs(prefs);
    applyAnimationPrefsToDocument(prefs);
  }, [prefs]);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setPrefs((current) => ({ ...current, animationsEnabled: enabled }));
  }, []);

  const setEnable3D = useCallback((enabled: boolean) => {
    setPrefs((current) => ({ ...current, enable3D: enabled }));
  }, []);

  const resetAnimationPrefs = useCallback(() => {
    setPrefs(defaultAnimationPrefs);
  }, []);

  const value = useMemo(
    () => ({
      ...prefs,
      setAnimationsEnabled,
      setEnable3D,
      resetAnimationPrefs,
    }),
    [prefs, resetAnimationPrefs, setAnimationsEnabled, setEnable3D]
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
