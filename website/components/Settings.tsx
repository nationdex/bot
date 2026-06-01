import { motion } from 'framer-motion';
import { Monitor, Palette, RotateCcw, Sparkles } from 'lucide-react';
import ThemeSettings from '@/components/ThemeSettings';
import { Card, CardContent } from '@/components/ui/card';
import { useAnimationPrefs } from '@/hooks/useAnimationPrefs';
import {
  useIs3DEnabled,
  useOsPrefersReducedMotion,
  useReducedMotion,
} from '@/hooks/useReducedMotion';
import { admin } from '@/lib/admin-classes';
import { bot } from '@/lib/bot';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

function SettingToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className={cn('block text-sm font-medium', admin.fg)}>
          {label}
        </label>
        <p className={cn('mt-1 text-xs', admin.muted)}>{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--admin-fg)_25%,transparent)]',
          checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform',
            checked
              ? 'translate-x-5 bg-[var(--admin-accent-fg)]'
              : 'translate-x-0 bg-[var(--admin-fg)] opacity-50'
          )}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { animationsEnabled, enable3D, setAnimationsEnabled, setEnable3D, resetAnimationPrefs } =
    useAnimationPrefs();
  const osReducedMotion = useOsPrefersReducedMotion();
  const reducedMotion = useReducedMotion();
  const threeDActive = useIs3DEnabled();

  return (
    <motion.div
      className="w-full space-y-4 sm:space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-4 sm:mb-6 space-y-3">
        <div>
          <h1 className={cn('mb-2 text-xl font-bold sm:text-2xl md:text-3xl', admin.fg)}>
            Settings
          </h1>
          <p className={cn('text-sm', admin.muted)}>
            Personalize the {bot.name} admin panel. Preferences are saved in this browser.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className={cn(admin.card)}>
          <CardContent className="space-y-6 p-5">
            <div className="flex items-center gap-2">
              <Palette className={cn('h-4 w-4', admin.muted)} />
              <h3 className={cn('text-sm font-medium', admin.muted)}>Theme &amp; appearance</h3>
            </div>
            <ThemeSettings />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className={cn(admin.card)}>
          <CardContent className="space-y-6 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className={cn('h-4 w-4', admin.muted)} />
              <h3 className={cn('text-sm font-medium', admin.muted)}>Motion &amp; effects</h3>
            </div>

            <div className="space-y-5">
              <SettingToggle
                id="animations-enabled"
                label="Enable animations"
                description="Page transitions, staggered reveals, hover feedback, and search palette motion."
                checked={animationsEnabled}
                disabled={osReducedMotion}
                onChange={setAnimationsEnabled}
              />

              <SettingToggle
                id="animations-3d"
                label="Enable 3D effects"
                description="Card tilt, perspective page turns, depth on hover, and chart bar flips."
                checked={enable3D}
                disabled={!animationsEnabled || osReducedMotion}
                onChange={setEnable3D}
              />
            </div>

            {osReducedMotion && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs',
                  admin.elevated,
                  admin.muted
                )}
              >
                <Monitor className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', admin.muted)} />
                <p>
                  Your system has <strong className={admin.fg}>Reduce motion</strong> enabled.
                  Animations stay off regardless of these toggles.
                </p>
              </div>
            )}

            <div className={cn('rounded-lg border px-3 py-3 text-xs', admin.elevated, admin.muted)}>
              <p className={cn('font-medium', admin.fg)}>Current motion mode</p>
              <p className="mt-1">
                {reducedMotion
                  ? 'Static — no animations'
                  : threeDActive
                    ? 'Full — 2D and 3D motion'
                    : 'Lite — 2D animations only (3D off)'}
              </p>
            </div>

            <div className="flex justify-end border-t border-[var(--admin-border)] pt-4">
              <motion.button
                type="button"
                onClick={resetAnimationPrefs}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  admin.elevated,
                  admin.muted,
                  admin.hoverRow
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset motion defaults
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
