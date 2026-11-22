import { useAnimationPrefs, useMotionPref, useOsPrefersReducedMotion } from '@/hooks/useAnimationPrefs';

export { useOsPrefersReducedMotion, useMotionPref };

export function useReducedMotion() {
  const osReduced = useOsPrefersReducedMotion();
  const { masterEnabled } = useAnimationPrefs();
  return osReduced || !masterEnabled;
}

export function useIs3DEnabled() {
  return useMotionPref('depth3d');
}
