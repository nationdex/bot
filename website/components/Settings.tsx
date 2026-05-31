import { motion } from 'framer-motion';
import { Monitor, RotateCcw, Sparkles } from 'lucide-react';
import PlaceholderNotice from '@/components/PlaceholderNotice';
import { Card, CardContent } from '@/components/ui/card';
import { useAnimationPrefs } from '@/hooks/useAnimationPrefs';
import {
  useIs3DEnabled,
  useOsPrefersReducedMotion,
  useReducedMotion,
} from '@/hooks/useReducedMotion';
import { bot } from '@/lib/bot';
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
        <label htmlFor={id} className="block text-sm font-medium text-white">
          {label}
        </label>
        <p className="mt-1 text-xs text-white/45">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]',
          checked ? 'bg-white' : 'bg-[#333]',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform',
            checked ? 'translate-x-5 bg-[#0F0F0F]' : 'translate-x-0 bg-white/80'
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
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">
        <div>
          <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl md:text-3xl">Settings</h1>
          <p className="text-sm text-white/50">
            Personalize the {bot.name} admin panel. Preferences are saved in this browser.
          </p>
        </div>
        <PlaceholderNotice />
      </div>

      <Card className="border-[#252525] bg-[#1A1A1A]">
        <CardContent className="space-y-6 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white/70" />
            <h3 className="text-sm font-medium text-white/70">Motion &amp; effects</h3>
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
            <div className="flex items-start gap-2 rounded-lg border border-[#333] bg-[#141414] px-3 py-2.5 text-xs text-white/50">
              <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
              <p>
                Your system has <strong className="text-white/70">Reduce motion</strong> enabled.
                Animations stay off regardless of these toggles.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-[#252525] bg-[#141414] px-3 py-3 text-xs text-white/45">
            <p className="font-medium text-white/60">Current mode</p>
            <p className="mt-1">
              {reducedMotion
                ? 'Static — no animations'
                : threeDActive
                  ? 'Full — 2D and 3D motion'
                  : 'Lite — 2D animations only (3D off)'}
            </p>
          </div>

          <div className="flex justify-end border-t border-[#252525] pt-4">
            <motion.button
              type="button"
              onClick={resetAnimationPrefs}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#333] bg-[#252525] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to defaults
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
