export const springSnappy = { type: 'spring' as const, stiffness: 420, damping: 30 };
export const springSoft = { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.9 };

/** Showcase-style 3D pacing (~0.5–0.6s feel) */
export const spring3D = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 26,
  mass: 0.85,
};

export const tiltSpring = {
  stiffness: 340,
  damping: 28,
  mass: 0.55,
};

export const perspectiveDefault = 1200;

export const pageTransition = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)' },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
};

export const pageTransition3D = {
  initial: {
    opacity: 0,
    rotateY: -14,
    x: 48,
    scale: 0.97,
    transformPerspective: perspectiveDefault,
  },
  animate: {
    opacity: 1,
    rotateY: 0,
    x: 0,
    scale: 1,
    transformPerspective: perspectiveDefault,
  },
  exit: {
    opacity: 0,
    rotateY: 10,
    x: -36,
    scale: 0.98,
    transformPerspective: perspectiveDefault,
  },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export const pageTransitionFlat = pageTransition;

export const pageTransitionNone = {
  initial: false as const,
  animate: {},
  exit: {},
  transition: { duration: 0 },
};

export const flipIn3D = {
  initial: { opacity: 0, rotateX: -72, y: 8, transformPerspective: 900 },
  animate: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 900 },
  exit: { opacity: 0, rotateX: 72, y: -6, transformPerspective: 900 },
  transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
};

export const cardEnter3D = {
  hidden: { opacity: 0, rotateX: 18, y: 32, scale: 0.94, transformPerspective: 1100 },
  show: {
    opacity: 1,
    rotateX: 0,
    y: 0,
    scale: 1,
    transformPerspective: 1100,
    transition: spring3D,
  },
};

export const barGrow3D = {
  hidden: { height: 0, opacity: 0, rotateX: 88, transformOrigin: 'bottom' },
  show: (delay: number) => ({
    height: 'var(--bar-height)',
    opacity: 1,
    rotateX: 0,
    transformOrigin: 'bottom',
    transition: { delay, ...spring3D },
  }),
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: springSoft },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.28 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: springSoft },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 14 },
  show: { opacity: 1, x: 0, transition: springSoft },
};

export const listItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: springSoft },
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
};

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.01, transition: springSnappy },
  tap: { scale: 0.98, transition: springSnappy },
};
