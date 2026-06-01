import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIs3DEnabled, useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemePrefs } from '@/hooks/useThemePrefs';
import { admin } from '@/lib/admin-classes';
import { fadeUp, springSnappy, staggerContainer } from '@/lib/motion';
import type { ThemePalette } from '@/lib/theme-prefs';
import { presetShellBackground, type ThemePreset, themePresets } from '@/lib/theme-presets';
import { cn } from '@/lib/utils';

function palettesMatch(a: ThemePalette, b: ThemePalette): boolean {
  return (
    a.shell === b.shell &&
    a.sidebar === b.sidebar &&
    a.panel === b.panel &&
    a.card === b.card &&
    a.accent === b.accent &&
    a.gradientEnabled === b.gradientEnabled &&
    a.gradientFrom === b.gradientFrom &&
    a.gradientTo === b.gradientTo
  );
}

function PresetCard({
  preset,
  active,
  onApply,
}: {
  preset: ThemePreset;
  active: boolean;
  onApply: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const enable3D = useIs3DEnabled();

  return (
    <motion.button
      type="button"
      onClick={onApply}
      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.01 }}
      whileTap={reducedMotion ? undefined : { scale: 0.99 }}
      style={enable3D ? { transformPerspective: 900 } : undefined}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border text-left transition-shadow',
        active
          ? 'border-[var(--admin-accent)] shadow-lg ring-1 ring-[color-mix(in_srgb,var(--admin-accent)_35%,transparent)]'
          : cn(admin.elevated, admin.hoverRow, 'hover:shadow-md')
      )}
    >
      <div className="flex h-14">
        <div
          className="flex flex-1 items-end p-2"
          style={{ background: presetShellBackground(preset.dark) }}
        >
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-medium"
            style={{
              background: preset.dark.accent,
              color: preset.dark.accentForeground,
            }}
          >
            Dark
          </span>
        </div>
        <div
          className="flex flex-1 items-end justify-end border-l border-[var(--admin-border)] p-2"
          style={{ background: presetShellBackground(preset.light) }}
        >
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-medium"
            style={{
              background: preset.light.accent,
              color: preset.light.accentForeground,
            }}
          >
            Light
          </span>
        </div>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium', admin.fg)}>{preset.name}</p>
          {active && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--admin-accent)]" />}
        </div>
        <p className={cn('text-[11px] leading-snug', admin.muted)}>{preset.description}</p>
      </div>
    </motion.button>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
  picker = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  picker?: boolean;
}) {
  const isHex = /^#[0-9A-Fa-f]{3,8}$/.test(value.trim());
  const pickerHex = isHex
    ? value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value.slice(0, 7)
    : '#888888';

  return (
    <div
      className={cn(
        'min-w-0 space-y-2 rounded-lg border p-3',
        admin.panel,
        'border-[var(--admin-border)]'
      )}
    >
      <label htmlFor={`${id}-input`} className={cn('block text-xs font-medium', admin.fg)}>
        {label}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        {picker && isHex && (
          <label
            className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[var(--admin-border)]"
            style={{ backgroundColor: pickerHex }}
            title="Pick color"
          >
            <input
              type="color"
              value={pickerHex}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        )}
        <Input
          id={`${id}-input`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className={cn('h-9 min-w-0 flex-1 font-mono text-xs', admin.input)}
        />
      </div>
    </div>
  );
}

function PaletteEditor({
  title,
  palette,
  onChange,
  onReset,
}: {
  title: string;
  palette: ThemePalette;
  onChange: (patch: Partial<ThemePalette>) => void;
  onReset: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={cn('space-y-4 rounded-xl border p-4 sm:p-5', admin.elevated)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className={cn('text-sm font-medium', admin.fg)}>{title}</h4>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors',
            admin.muted,
            admin.hoverRow
          )}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <motion.div
        layout
        className="h-16 rounded-lg border border-[var(--admin-border)]"
        style={{
          background: palette.gradientEnabled
            ? `linear-gradient(${palette.gradientAngle}deg, ${palette.gradientFrom}, ${palette.gradientTo})`
            : palette.shell,
        }}
        transition={reducedMotion ? { duration: 0 } : springSnappy}
      />

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
        <ColorField
          id={`${title}-shell`}
          label="Shell"
          value={palette.shell}
          onChange={(shell) => onChange({ shell })}
        />
        <ColorField
          id={`${title}-sidebar`}
          label="Sidebar"
          value={palette.sidebar}
          onChange={(sidebar) => onChange({ sidebar })}
        />
        <ColorField
          id={`${title}-panel`}
          label="Panel"
          value={palette.panel}
          onChange={(panel) => onChange({ panel })}
        />
        <ColorField
          id={`${title}-card`}
          label="Card"
          value={palette.card}
          onChange={(card) => onChange({ card })}
        />
        <ColorField
          id={`${title}-elevated`}
          label="Elevated"
          value={palette.elevated}
          onChange={(elevated) => onChange({ elevated })}
        />
        <ColorField
          id={`${title}-border`}
          label="Border"
          value={palette.border}
          onChange={(border) => onChange({ border })}
        />
        <ColorField
          id={`${title}-fg`}
          label="Text"
          value={palette.foreground}
          onChange={(foreground) => onChange({ foreground })}
        />
        <ColorField
          id={`${title}-muted`}
          label="Muted text"
          value={palette.muted}
          picker={false}
          onChange={(muted) => onChange({ muted })}
        />
        <ColorField
          id={`${title}-accent`}
          label="Accent"
          value={palette.accent}
          onChange={(accent) => onChange({ accent })}
        />
      </div>

      <div className="space-y-3 border-t border-[var(--admin-border)] pt-4">
        <label className="flex items-center justify-between gap-3">
          <span className={cn('text-xs font-medium', admin.fg)}>Shell gradient</span>
          <button
            type="button"
            role="switch"
            aria-checked={palette.gradientEnabled}
            onClick={() => onChange({ gradientEnabled: !palette.gradientEnabled })}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors',
              palette.gradientEnabled ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]'
            )}
          >
            <motion.span
              layout
              transition={springSnappy}
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full',
                palette.gradientEnabled
                  ? 'translate-x-5 bg-[var(--admin-accent-fg)]'
                  : 'translate-x-0 bg-[var(--admin-fg)] opacity-40'
              )}
            />
          </button>
        </label>

        {palette.gradientEnabled && (
          <div className="grid grid-cols-1 gap-3">
            <ColorField
              id={`${title}-grad-from`}
              label="Gradient from"
              value={palette.gradientFrom}
              onChange={(gradientFrom) => onChange({ gradientFrom })}
            />
            <ColorField
              id={`${title}-grad-to`}
              label="Gradient to"
              value={palette.gradientTo}
              onChange={(gradientTo) => onChange({ gradientTo })}
            />
            <div className="space-y-2 rounded-lg border border-[var(--admin-border)] p-3">
              <label htmlFor={`${title}-angle`} className={cn('text-xs font-medium', admin.fg)}>
                Angle ({palette.gradientAngle}°)
              </label>
              <input
                id={`${title}-angle`}
                type="range"
                min={0}
                max={360}
                value={palette.gradientAngle}
                onChange={(e) => onChange({ gradientAngle: Number(e.target.value) })}
                className="w-full accent-[var(--admin-accent)]"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ThemeSettings() {
  const {
    mode,
    dark,
    light,
    setMode,
    updateDark,
    updateLight,
    applyPreset,
    resetTheme,
    resetDarkPalette,
    resetLightPalette,
  } = useThemePrefs();

  const activePresetId =
    themePresets.find(
      (preset) => palettesMatch(preset.dark, dark) && palettesMatch(preset.light, light)
    )?.id ?? null;

  return (
    <motion.div className="space-y-5" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        {(['dark', 'light'] as const).map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => setMode(option)}
            className={cn(
              'min-h-9 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors',
              mode === option ? admin.accentPill : cn(admin.elevated, admin.muted)
            )}
          >
            {option} mode
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        <div>
          <h4 className={cn('text-sm font-medium', admin.fg)}>Theme presets</h4>
          <p className={cn('mt-1 text-xs', admin.muted)}>
            Apply a full dark + light palette in one click. You can still fine-tune colors below.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themePresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              active={activePresetId === preset.id}
              onApply={() => applyPreset(preset)}
            />
          ))}
        </div>
      </motion.div>

      <motion.p variants={fadeUp} className={cn('text-xs', admin.muted)}>
        Customize colors and shell gradients separately for dark and light mode. Active mode:{' '}
        <strong className={admin.fg}>{mode}</strong>.
      </motion.p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PaletteEditor
          title="Dark mode palette"
          palette={dark}
          onChange={updateDark}
          onReset={resetDarkPalette}
        />
        <PaletteEditor
          title="Light mode palette"
          palette={light}
          onChange={updateLight}
          onReset={resetLightPalette}
        />
      </div>

      <motion.div
        variants={fadeUp}
        className="flex justify-end border-t border-[var(--admin-border)] pt-4"
      >
        <button
          type="button"
          onClick={resetTheme}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            admin.elevated,
            admin.muted,
            admin.hoverRow
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset all theme defaults
        </button>
      </motion.div>
    </motion.div>
  );
}
