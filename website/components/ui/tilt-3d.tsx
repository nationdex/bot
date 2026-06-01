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
import { spring3D, tiltSpring } from '@/lib/motion';
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

export function Tilt3D({
  children,
  className,
  maxTilt = 10,
  lift = 10,
  sheen = true,
  perspective = 1100,
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
  const depth = useSpring(useTransform(hover, [0, 1], [0, lift]), tiltSpring);

  const sheenX = useTransform(pointerX, [0, 1], [20, 80]);
  const sheenY = useTransform(pointerY, [0, 1], [20, 80]);
  const sheenOpacity = useTransform(hover, [0, 1], [0, 0.14]);
  const sheenBackground = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.22) 0%, transparent 58%)`;

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

  const enterTransition: Transition = { ...spring3D, delay: enterDelay };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const enterInitial = enter
    ? enable3D
      ? { opacity: 0, rotateX: 16, y: 28, scale: 0.94 }
      : { opacity: 0, y: 14, scale: 0.98 }
    : false;

  return (
    <div
      className={cn('perspective-scene', className)}
      style={{ perspective: enableTilt ? perspective : undefined }}
    >
      <motion.div
        className="preserve-3d gpu-layer h-full"
        initial={enterInitial}
        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        transition={enterTransition}
        style={enable3D ? { transformPerspective: perspective } : undefined}
      >
        <motion.div
          ref={ref}
          className="preserve-3d gpu-layer relative h-full isolate"
          onPointerMove={enableTilt ? handleMove : undefined}
          onPointerEnter={enableTilt ? handleEnter : undefined}
          onPointerLeave={enableTilt ? handleLeave : undefined}
          style={
            enableTilt
              ? {
                  rotateX: tiltX,
                  rotateY: tiltY,
                  z: depth,
                  transformStyle: 'preserve-3d',
                }
              : undefined
          }
        >
          {enableTilt && sheen && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
              style={{ background: sheenBackground, opacity: sheenOpacity }}
            />
          )}
          <div className="relative z-[1] h-full">{children}</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
