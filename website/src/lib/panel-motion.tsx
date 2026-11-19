import {
  Children, createContext, forwardRef, isValidElement, useContext, useEffect, useLayoutEffect, useRef, useState,
  type ComponentPropsWithoutRef, type CSSProperties, type ReactNode,
} from 'preact/compat';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Timing = {
  duration?: number;
  delay?: number;
  delayChildren?: number;
  staggerChildren?: number;
};
type Frame = {
  opacity?: number;
  x?: number | string;
  y?: number | string;
  z?: number;
  scale?: number;
  rotate?: number;
  rotateY?: number;
  height?: number | string;
  transition?: Timing;
};
type Phase = Frame | string;
type MotionProps = {
  className?: string;
  initial?: Phase | false;
  animate?: Phase;
  exit?: Frame;
  variants?: Record<string, Frame>;
  transition?: Timing;
  whileHover?: Frame;
  whileTap?: Frame;
  style?: CSSProperties & { transformPerspective?: number };
};
type Tag = 'a' | 'aside' | 'button' | 'div' | 'main' | 'p' | 'span' | 'tbody' | 'tr';
export type HTMLMotionProps<T extends Tag> = Omit<ComponentPropsWithoutRef<T>, keyof MotionProps> & MotionProps;

const Presence = createContext({ exiting: false, enter: true });
const Variants = createContext<{ initial?: Phase | false; animate?: Phase; stagger?: Timing }>({});
const exitDuration = 220;

function usePresence(children: ReactNode, wait: boolean, reduced: boolean) {
  const current = Children.toArray(children).filter(isValidElement);
  const latest = useRef(current);
  useLayoutEffect(() => { latest.current = current; });
  const keys = current.map((child) => child.key);
  const [snapshot, setSnapshot] = useState({ current, leaving: [] as typeof current });
  if (keys.length !== snapshot.current.length || keys.some((key, i) => key !== snapshot.current[i].key)) {
    setSnapshot({
      current,
      leaving: reduced ? [] : [...snapshot.leaving, ...latest.current]
        .filter((child, i, all) => !keys.includes(child.key) && all.findIndex((item) => item.key === child.key) === i),
    });
  }
  useEffect(() => {
    if (!snapshot.leaving.length) return;
    const timer = setTimeout(() => setSnapshot((state) => ({ ...state, leaving: [] })), exitDuration);
    return () => clearTimeout(timer);
  }, [snapshot.leaving]);
  const leaving = reduced ? [] : snapshot.leaving;
  return {
    leaving,
    visible: wait && leaving.length ? [] : current,
  };
}

export function AnimatePresence({ children, initial = true, mode }: {
  children: ReactNode;
  initial?: boolean;
  mode?: 'wait' | 'popLayout';
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { visible, leaving } = usePresence(children, mode === 'wait', reduced);
  return <>
    {visible.map((child) => <Presence.Provider key={child.key} value={{ exiting: false, enter: initial || mounted }}>{child}</Presence.Provider>)}
    {leaving.map((child) => <Presence.Provider key={child.key} value={{ exiting: true, enter: false }}>{child}</Presence.Provider>)}
  </>;
}

function length(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value;
}

function transform(frame: Frame, perspective?: number) {
  const parts = [];
  if (perspective) parts.push(`perspective(${perspective}px)`);
  if (frame.x !== undefined || frame.y !== undefined || frame.z !== undefined) {
    parts.push(`translate3d(${length(frame.x ?? 0)}, ${length(frame.y ?? 0)}, ${length(frame.z ?? 0)})`);
  }
  if (frame.rotate !== undefined) parts.push(`rotate(${frame.rotate}deg)`);
  if (frame.rotateY !== undefined) parts.push(`rotateY(${frame.rotateY}deg)`);
  if (frame.scale !== undefined) parts.push(`scale(${frame.scale})`);
  return parts.join(' ') || 'none';
}

function motionElement<T extends Tag>(tag: T) {
  return forwardRef<HTMLElementTagNameMap[T], HTMLMotionProps<T>>(function PanelMotion(rawProps, ref) {
    const {
      initial, animate, exit, variants, transition, whileHover, whileTap,
      style, className, children, ...props
    } = rawProps as HTMLMotionProps<'div'>;
    const { exiting, enter } = useContext(Presence);
    const inherited = useContext(Variants);
    const reduced = useReducedMotion();
    const fromPhase = initial ?? inherited.initial;
    const toPhase = animate ?? inherited.animate;
    const resolve = (phase?: Phase | false) => typeof phase === 'string' ? variants?.[phase] : phase || undefined;
    const from = resolve(fromPhase);
    const to = resolve(toPhase);
    const enterOnMount = useRef(enter);
    const appearance = exiting ? exit : enterOnMount.current ? from : undefined;
    const timing = exiting ? exit?.transition ?? transition : to?.transition ?? transition;
    const stagger = variants && typeof fromPhase === 'string' ? inherited.stagger : undefined;
    const { transformPerspective, ...inline } = style ?? {};
    const animated = !reduced && appearance && (timing?.duration ?? 0.2) > 0;
    const base = transform(to ?? {}, transformPerspective);
    const feedback = !reduced && (whileHover || whileTap);
    const css = {
      ...inline,
      ...(to?.height !== undefined && { height: length(to.height) }),
      ...(to?.opacity !== undefined && { opacity: to.opacity }),
      ...(base !== 'none' && { transform: base }),
      ...(animated && {
        '--panel-motion-opacity': appearance.opacity ?? to?.opacity ?? 1,
        '--panel-motion-transform': transform(appearance, transformPerspective),
        '--panel-motion-height': appearance.height === undefined ? 'auto' : length(appearance.height),
        '--panel-motion-duration': `${Math.min(exiting ? 0.2 : Infinity, timing?.duration ?? 0.2)}s`,
        '--panel-motion-delay': `${exiting ? 0 : timing?.delay ?? stagger?.delayChildren ?? 0}s`,
        '--panel-motion-stagger': `${exiting ? 0 : stagger?.staggerChildren ?? 0}s`,
      }),
      ...(feedback && {
        '--panel-motion-hover': whileHover ? transform({ ...to, ...whileHover }, transformPerspective) : base,
        '--panel-motion-tap': whileTap ? transform({ ...to, ...whileTap }, transformPerspective) : base,
      }),
    } as CSSProperties;
    const classes = [className, animated && (exiting ? 'panel-motion-exit' : 'panel-motion-enter'),
      animated && appearance.height !== undefined && 'panel-motion-height', feedback && 'panel-motion-feedback'].filter(Boolean).join(' ');
    const Element = tag as 'div';
    const content = typeof fromPhase === 'string' || typeof toPhase === 'string'
      ? <Variants.Provider value={{ initial: fromPhase, animate: toPhase, stagger: to?.transition?.staggerChildren ? to.transition : inherited.stagger }}>{children}</Variants.Provider>
      : children;
    return <Element {...props} ref={ref as React.Ref<HTMLDivElement>} className={classes} style={css}
      inert={exiting || props.inert} aria-hidden={exiting || props['aria-hidden']}>{content}</Element>;
  });
}

export const m = {
  a: motionElement('a'), aside: motionElement('aside'), button: motionElement('button'),
  div: motionElement('div'), main: motionElement('main'), p: motionElement('p'),
  span: motionElement('span'), tbody: motionElement('tbody'), tr: motionElement('tr'),
};
