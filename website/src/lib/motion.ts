export const quickTransition = { duration: 0.22 };
const listTransition = { duration: 0.28 };

export const perspectiveDefault = 1200;

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const pageTransitionNone = {
  initial: false as const,
  animate: {},
  exit: {},
  transition: { duration: 0 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: listTransition },
};

export const listItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: listTransition },
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
};
