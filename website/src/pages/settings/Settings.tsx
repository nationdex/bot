import { AnimatePresence, m } from '@/lib/panel-motion';
import { ChevronRight, Gauge, Monitor, Palette, RotateCcw, Sparkles } from '@/components/icons';
import { useState } from 'preact/hooks';
import InstallApp from '@/components/layout/InstallApp';
import ThemeSettings from '@/pages/settings/ThemeSettings';
import RemoteExtrasSettings from '@/pages/settings/RemoteExtrasSettings';
import { Card, CardContent } from '@/components/ui/card';
import { useAnimationPrefs } from '@/hooks/useAnimationPrefs';
import { useMotionPref, useOsPrefersReducedMotion } from '@/hooks/useReducedMotion';
import { admin } from '@/lib/admin-classes';
import { motionSettingGroups, type MotionPrefKey } from '@/lib/animation-prefs';
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
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform',
            checked ? 'translate-x-5 bg-[var(--admin-accent-fg)]' : 'translate-x-0 bg-[var(--admin-fg)] opacity-50',
          )}
        />
      </button>
    </div>
  );
}

export default function Settings({ isOwner }: { isOwner: boolean }) {
  const prefs = useAnimationPrefs();
  const { masterEnabled, setMasterEnabled, setPref, applyLowSpecMode, resetAnimationPrefs } = prefs;
  const osReducedMotion = useOsPrefersReducedMotion();
  const hoverFeedback = useMotionPref('hoverFeedback');
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(['theme', 'motion']));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const disabled = osReducedMotion || !masterEnabled;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <InstallApp />
      {isOwner && (
        <Card className={cn(admin.card, 'overflow-hidden')}>
          <div className="p-5">
            <h3 className={cn('text-sm font-medium', admin.fg)}>Remote extras</h3>
            <p className={cn('mt-1 text-xs', admin.muted)}>
              Manage the allowlist used by the extras website. The bot's API token is issued separately through Discord
              and is never stored in these settings.
            </p>
          </div>
          <CardContent className="px-5 pb-5 pt-0">
            <RemoteExtrasSettings />
          </CardContent>
        </Card>
      )}
      <Card className={cn(admin.card, 'overflow-hidden')}>
        <button
          type="button"
          onClick={() => toggleSection('theme')}
          className="flex items-center gap-2 w-full p-5 text-left cursor-pointer select-none group"
        >
          <Palette className={cn('h-4 w-4 shrink-0', admin.muted)} />
          <h3 className={cn('text-sm font-medium transition-colors group-hover:text-[var(--admin-fg)]', admin.muted)}>
            Theme &amp; appearance
          </h3>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              admin.muted,
              openSections.has('theme') && 'rotate-90 text-[var(--admin-fg)]',
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.has('theme') && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="px-5 pb-5 pt-0">
                <ThemeSettings />
              </CardContent>
            </m.div>
          )}
        </AnimatePresence>
      </Card>

      <Card className={cn(admin.card, 'overflow-hidden')}>
        <button
          type="button"
          onClick={() => toggleSection('motion')}
          className="flex items-center gap-2 w-full p-5 text-left cursor-pointer select-none group"
        >
          <Sparkles className={cn('h-4 w-4 shrink-0', admin.muted)} />
          <h3 className={cn('text-sm font-medium transition-colors group-hover:text-[var(--admin-fg)]', admin.muted)}>
            Motion &amp; effects
          </h3>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              admin.muted,
              openSections.has('motion') && 'rotate-90 text-[var(--admin-fg)]',
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.has('motion') && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-6 px-5 pb-5 pt-0">
                <SettingToggle
                  id="motion-master"
                  label="Enable motion"
                  description="Master switch. Turn off to disable every effect below."
                  checked={masterEnabled}
                  disabled={osReducedMotion}
                  onChange={setMasterEnabled}
                />

                {motionSettingGroups.map((group) => (
                  <div key={group.title} className="space-y-4">
                    <p className={cn('text-xs font-medium uppercase tracking-wide', admin.muted)}>{group.title}</p>
                    <div className="space-y-4">
                      {group.settings.map((setting) => (
                        <SettingToggle
                          key={setting.key}
                          id={`motion-${setting.key}`}
                          label={setting.label}
                          description={setting.description}
                          checked={prefs[setting.key as MotionPrefKey]}
                          disabled={disabled}
                          onChange={(value) => setPref(setting.key, value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {osReducedMotion && (
                  <div
                    className={cn('flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs', admin.elevated, admin.muted)}
                  >
                    <Monitor className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', admin.muted)} />
                    <p>
                      System <strong className={admin.fg}>Reduce motion</strong> is on. These toggles have no effect.
                    </p>
                  </div>
                )}
              </CardContent>
            </m.div>
          )}
        </AnimatePresence>
      </Card>

      <div className={cn('flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between')}>
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[var(--admin-card)] w-fit">
          <button
            type="button"
            onClick={applyLowSpecMode}
            disabled={osReducedMotion || !masterEnabled}
            className={cn(
              'h-7 sm:h-8 px-3 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors shrink-0',
              admin.muted,
              admin.hoverRow,
              (osReducedMotion || !masterEnabled) && 'cursor-not-allowed opacity-50',
            )}
          >
            <Gauge className="h-3.5 w-3.5 shrink-0" />
            <span>Low spec mode</span>
          </button>
          <m.button
            type="button"
            onClick={resetAnimationPrefs}
            whileTap={hoverFeedback ? { scale: 0.98 } : undefined}
            className={cn(
              'h-7 sm:h-8 px-3 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none shrink-0',
              admin.muted,
              admin.hoverRow,
            )}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span>Restore defaults</span>
          </m.button>
        </div>
      </div>
    </div>
  );
}
