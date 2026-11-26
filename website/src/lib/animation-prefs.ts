import { storage } from '@/lib/storage';
export type MotionPrefKey =
  | 'pageTransitions'
  | 'listReveal'
  | 'hoverFeedback'
  | 'searchMotion'
  | 'depth3d'
  | 'cardTilt'
  | 'chartMotion'
  | 'smoothScroll';

export type AnimationPrefs = {
  masterEnabled: boolean;
  pageTransitions: boolean;
  listReveal: boolean;
  hoverFeedback: boolean;
  searchMotion: boolean;
  depth3d: boolean;
  cardTilt: boolean;
  chartMotion: boolean;
  smoothScroll: boolean;
};

export const defaultAnimationPrefs: AnimationPrefs = {
  masterEnabled: true,
  pageTransitions: true,
  listReveal: true,
  hoverFeedback: true,
  searchMotion: true,
  depth3d: true,
  cardTilt: true,
  chartMotion: true,
  smoothScroll: true,
};

type MotionSettingDef = {
  key: MotionPrefKey;
  label: string;
  description: string;
  heavy?: boolean;
};

type MotionSettingGroup = {
  title: string;
  settings: MotionSettingDef[];
};

export const motionSettingGroups: MotionSettingGroup[] = [
  {
    title: 'Navigation',
    settings: [
      {
        key: 'pageTransitions',
        label: 'Page transitions',
        description: 'Fade when switching sections.',
      },
      {
        key: 'smoothScroll',
        label: 'Smooth scrolling',
        description: 'CSS scroll inside the panel.',
      },
    ],
  },
  {
    title: 'Content',
    settings: [
      {
        key: 'listReveal',
        label: 'List and card reveals',
        description: 'Staggered rows, stats, and catalog items on load.',
        heavy: true,
      },
      {
        key: 'chartMotion',
        label: 'Chart animations',
        description: 'Growth bars and table row entrances on the dashboard.',
        heavy: true,
      },
    ],
  },
  {
    title: 'Interaction',
    settings: [
      {
        key: 'hoverFeedback',
        label: 'Hover and press',
        description: 'Scale on buttons, sidebar links, and filter pills.',
      },
      {
        key: 'searchMotion',
        label: 'Search panel',
        description: 'Open and close motion for the command search.',
      },
    ],
  },
  {
    title: 'Depth',
    settings: [
      {
        key: 'depth3d',
        label: '3D perspective',
        description: 'Panel depth, header flip, and chart bar rotation.',
        heavy: true,
      },
      {
        key: 'cardTilt',
        label: 'Card tilt on hover',
        description: 'Pointer-tracking tilt. Off on touch devices.',
        heavy: true,
      },
    ],
  },
];

const STORAGE_KEY = 'nationdex-admin-animation-prefs';

type LegacyAnimationPrefs = {
  animationsEnabled?: boolean;
  enable3D?: boolean;
};

function readBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function migrateLegacy(parsed: LegacyAnimationPrefs & Partial<AnimationPrefs>): AnimationPrefs {
  if (typeof parsed.masterEnabled === 'boolean') {
    return normalizeAnimationPrefs(parsed);
  }

  const on = parsed.animationsEnabled !== false;
  const depth = on && parsed.enable3D !== false;

  return {
    masterEnabled: on,
    pageTransitions: on,
    listReveal: on,
    hoverFeedback: on,
    searchMotion: on,
    depth3d: depth,
    cardTilt: depth,
    chartMotion: on,
    smoothScroll: on,
  };
}

export function normalizeAnimationPrefs(partial: Partial<AnimationPrefs>): AnimationPrefs {
  return {
    masterEnabled: readBool(partial.masterEnabled, defaultAnimationPrefs.masterEnabled),
    pageTransitions: readBool(partial.pageTransitions, defaultAnimationPrefs.pageTransitions),
    listReveal: readBool(partial.listReveal, defaultAnimationPrefs.listReveal),
    hoverFeedback: readBool(partial.hoverFeedback, defaultAnimationPrefs.hoverFeedback),
    searchMotion: readBool(partial.searchMotion, defaultAnimationPrefs.searchMotion),
    depth3d: readBool(partial.depth3d, defaultAnimationPrefs.depth3d),
    cardTilt: readBool(partial.cardTilt, defaultAnimationPrefs.cardTilt),
    chartMotion: readBool(partial.chartMotion, defaultAnimationPrefs.chartMotion),
    smoothScroll: readBool(partial.smoothScroll, defaultAnimationPrefs.smoothScroll),
  };
}

export function loadAnimationPrefs(): AnimationPrefs {
  if (typeof window === 'undefined') return defaultAnimationPrefs;

  try {
    const raw = storage.get(STORAGE_KEY);
    if (!raw) return defaultAnimationPrefs;
    const parsed = JSON.parse(raw) as LegacyAnimationPrefs & Partial<AnimationPrefs>;
    return migrateLegacy(parsed);
  } catch {
    return defaultAnimationPrefs;
  }
}

export function saveAnimationPrefs(prefs: AnimationPrefs) {
  if (typeof window === 'undefined') return;
  storage.set(STORAGE_KEY, JSON.stringify(prefs));
}

export function applyAnimationPrefsToDocument(prefs: AnimationPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.animations = prefs.masterEnabled ? 'on' : 'off';
  root.dataset.hoverFeedback = prefs.masterEnabled && prefs.hoverFeedback ? 'on' : 'off';
  root.dataset.animations3d = prefs.masterEnabled && prefs.depth3d ? 'on' : 'off';
  root.dataset.smoothScroll = prefs.masterEnabled && prefs.smoothScroll ? 'on' : 'off';
}

export function applyLowSpecAnimationPrefs(prefs: AnimationPrefs): AnimationPrefs {
  return {
    ...prefs,
    listReveal: false,
    searchMotion: false,
    depth3d: false,
    cardTilt: false,
    chartMotion: false,
  };
}
