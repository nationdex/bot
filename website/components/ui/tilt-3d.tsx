import {
  motion,
  type Transition,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { type ReactNode, useCallback, useRef } from 'react';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import { springSoft, tiltSpring } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  lift?: number;
  sheen?: boolean;
  perspective?: number;
  enterDelay?: number;
  enter?: boolean;
};

/**
 * Mouse-tilt 3D on an outer shell only. Inner content stays flat (no preserve-3d)
 * so charts, text, and layout pills don't shear or blow up in 3D space.
 */
export function Tilt3D({
  children,
  className,
  maxTilt = 8,
  lift = 4,
  sheen = false,
  perspective = 1000,
  enterDelay = 0,
  enter = true,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();
  const coarsePointer = useCoarsePointer();
  const enableTilt = enable3D && !coarsePointer;

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const tiltX = useSpring(useTransform(pointerY, [0, 1], [maxTilt, -maxTilt]), tiltSpring);
  const tiltY = useSpring(useTransform(pointerX, [0, 1], [-maxTilt, maxTilt]), tiltSpring);
  const scale = useSpring(useTransform(hover, [0, 1], [1, 1 + lift / 100]), tiltSpring);

  const sheenX = useTransform(pointerX, [0, 1], [20, 80]);
  const sheenY = useTransform(pointerY, [0, 1], [20, 80]);
  const sheenOpacity = useTransform(hover, [0, 1], [0, 0.12]);
  const sheenBackground = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.18) 0%, transparent 55%)`;

  const rafRef = useRef<number>(0);

  const handleMove = useCallback(
    (event: React.PointerEvent) => {
      if (!enableTilt || !ref.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width);
        pointerY.set((event.clientY - rect.top) / rect.height);
      });
    },
    [enableTilt, pointerX, pointerY]
  );

  const handleEnter = () => hover.set(1);
  const handleLeave = () => {
    hover.set(0);
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  const enterTransition: Transition = { ...springSoft, delay: enterDelay };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const enterInitial = enter ? { opacity: 0, y: 16 } : false;

  return (
    <div
      className={cn('h-full', className)}
      style={{
        perspective: enableTilt ? perspective : undefined,
        perspectiveOrigin: '50% 50%',
      }}
    >
      <motion.div
        className="h-full"
        initial={enterInitial}
        animate={{ opacity: 1, y: 0 }}
        transition={enterTransition}
      >
        <motion.div
          ref={ref}
          className="relative h-full"
          onPointerMove={enableTilt ? handleMove : undefined}
          onPointerEnter={enableTilt ? handleEnter : undefined}
          onPointerLeave={enableTilt ? handleLeave : undefined}
          style={
            enableTilt
              ? {
                  rotateX: tiltX,
                  rotateY: tiltY,
                  scale,
                  transformStyle: 'flat',
                }
              : undefined
          }
        >
          {enableTilt && sheen && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
              style={{ background: sheenBackground, opacity: sheenOpacity }}
            />
          )}
          <div className="tilt-flat relative z-[1] h-full overflow-hidden rounded-lg">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
