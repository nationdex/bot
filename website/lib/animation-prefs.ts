export type AnimationPrefs = {
  animationsEnabled: boolean;
  enable3D: boolean;
};

export const defaultAnimationPrefs: AnimationPrefs = {
  animationsEnabled: true,
  enable3D: true,
};

const STORAGE_KEY = 'nationdex-admin-animation-prefs';

export function loadAnimationPrefs(): AnimationPrefs {
  if (typeof window === 'undefined') return defaultAnimationPrefs;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAnimationPrefs;
    const parsed = JSON.parse(raw) as Partial<AnimationPrefs>;
    return {
      animationsEnabled:
        typeof parsed.animationsEnabled === 'boolean'
          ? parsed.animationsEnabled
          : defaultAnimationPrefs.animationsEnabled,
      enable3D:
        typeof parsed.enable3D === 'boolean' ? parsed.enable3D : defaultAnimationPrefs.enable3D,
    };
  } catch {
    return defaultAnimationPrefs;
  }
}

export function saveAnimationPrefs(prefs: AnimationPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function applyAnimationPrefsToDocument(prefs: AnimationPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.animations = prefs.animationsEnabled ? 'on' : 'off';
  root.dataset.animations3d = prefs.animationsEnabled && prefs.enable3D ? 'on' : 'off';
}
