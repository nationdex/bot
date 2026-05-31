import { useEffect, useState } from 'react';
import { useAnimationPrefs } from '@/hooks/useAnimationPrefs';

function useOsReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** True when OS or user preference requests reduced / no motion. */
export function useReducedMotion() {
  const osReduced = useOsReducedMotion();
  const { animationsEnabled } = useAnimationPrefs();
  return osReduced || !animationsEnabled;
}

/** True when 3D tilt, perspective, and rotate transforms are allowed. */
export function useIs3DEnabled() {
  const osReduced = useOsReducedMotion();
  const { animationsEnabled, enable3D } = useAnimationPrefs();
  return enable3D && !osReduced && animationsEnabled;
}

export function useOsPrefersReducedMotion() {
  return useOsReducedMotion();
}
