import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Tilt3D } from '@/components/ui/tilt-3d';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/utils';

type AnimatedPanelProps = {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  maxTilt?: number;
  enterDelay?: number;
};

/** Panel with enter fade and optional safe 3D tilt (sheen off — no text clipping). */
export function AnimatedPanel({
  children,
  className,
  tilt = true,
  maxTilt = 6,
  enterDelay = 0,
}: AnimatedPanelProps) {
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();
  const useTilt = tilt && enable3D && !reducedMotion;

  if (useTilt) {
    return (
      <Tilt3D
        maxTilt={maxTilt}
        lift={8}
        sheen={false}
        enterDelay={enterDelay}
        className={cn('h-full', className)}
      >
        {children}
      </Tilt3D>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: enterDelay }}
      className={cn('h-full', className)}
    >
      {children}
    </motion.div>
  );
}
