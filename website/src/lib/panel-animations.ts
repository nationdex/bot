import { loadAnimationPrefs, type MotionPrefKey } from './animation-prefs';

export function panelMotionEnabled(preference: MotionPrefKey): boolean {
  const prefs = loadAnimationPrefs();
  return prefs.masterEnabled && prefs[preference] && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function revealPanelItems(items: HTMLCollection, axis: 'X' | 'Y') {
  if (!panelMotionEnabled('listReveal')) return;
  Array.from(items).forEach((item, index) => {
    item.animate(
      [
        { opacity: 0, transform: `translate${axis}(${axis === 'X' ? -8 : 12}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 240, delay: Math.min(index, 8) * 24, easing: 'ease-out', fill: 'backwards' },
    );
  });
}
