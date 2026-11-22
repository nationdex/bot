import { Check, ChevronDown, RotateCcw } from '@/components/icons';
import { useState } from 'preact/hooks';
import { Input } from '@/components/ui/input';
import { useThemePrefs } from '@/hooks/useThemePrefs';
import { admin } from '@/lib/admin-classes';
import type { ThemeMode, ThemePalette } from '@/lib/theme-prefs';
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

function MiniPreview({ palette }: { palette: ThemePalette }) {
  const shellBg = palette.gradientEnabled
    ? `linear-gradient(${palette.gradientAngle}deg, ${palette.gradientFrom}, ${palette.gradientTo})`
    : palette.shell;

  return (
    <div className="relative h-11 overflow-hidden rounded-lg" style={{ background: shellBg }}>
      <div className="absolute inset-y-0 left-0 w-[26%] rounded-l-lg" style={{ background: palette.sidebar }} />
      <div className="absolute inset-y-1 left-[30%] right-1 rounded-md" style={{ background: palette.panel }}>
        <div
          className="absolute left-1.5 top-1.5 h-1 w-6 rounded-sm opacity-80"
          style={{ background: palette.foreground }}
        />
        <div className="absolute bottom-1 left-1.5 right-1.5 h-3 rounded-sm" style={{ background: palette.card }} />
        <div className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: palette.accent }} />
      </div>
    </div>
  );
}

function PresetCard({
  preset,
  active,
  mode,
  onApply,
}: {
  preset: ThemePreset;
  active: boolean;
  mode: ThemeMode;
  onApply: () => void;
}) {
  const preview = mode === 'dark' ? preset.dark : preset.light;

  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        'group w-full rounded-xl p-3 text-left transition-colors',
        active ? 'bg-[color-mix(in_srgb,var(--admin-accent)_12%,var(--admin-elevated))]' : admin.hoverRow,
      )}
    >
      <MiniPreview palette={preview} />
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium', admin.fg)}>{preset.name}</span>
        {active ? (
          <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', admin.accent)}>
            <Check className="h-3 w-3" />
          </span>
        ) : (
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: preset.dark.accent }} />
            <span className="h-2 w-2 rounded-full" style={{ background: preset.light.accent }} />
          </span>
        )}
      </div>
    </button>
  );
}

function SwatchInput({
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
  const swatchColor = value.startsWith('#') ? value.slice(0, 7) : '#666666';

  return (
    <div className="flex items-center gap-3">
      {picker && value.startsWith('#') ? (
        <label htmlFor={id} className="relative shrink-0 cursor-pointer">
          <span
            className="block h-8 w-8 rounded-lg ring-1 ring-[color-mix(in_srgb,var(--admin-fg)_10%,transparent)]"
            style={{ background: swatchColor }}
          />
          <input
            id={id}
            type="color"
            value={swatchColor}
            onChange={(e) => onChange(e.currentTarget.value)}
            className="sr-only"
          />
        </label>
      ) : (
        <span
          className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-[color-mix(in_srgb,var(--admin-fg)_10%,transparent)]"
          style={{ background: value.startsWith('#') ? value : 'transparent' }}
        />
      )}
      <div className="min-w-0 flex-1">
        <label htmlFor={picker ? `${id}-text` : id} className={cn('block text-xs', admin.muted)}>
          {label}
        </label>
        {picker && value.startsWith('#') ? (
          <p className={cn('truncate text-sm tabular-nums', admin.fg)}>{swatchColor}</p>
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            omitDefaults="h-10 text-sm"
            className={cn('mt-0.5 h-8 text-xs', admin.input)}
          />
        )}
      </div>
    </div>
  );
}

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform',
          checked ? 'translate-x-5 bg-[var(--admin-accent-fg)]' : 'translate-x-0 bg-[var(--admin-fg)] opacity-40',
        )}
      />
    </button>
  );
}

const surfaceFields = [
  { key: 'shell' as const, label: 'Page background' },
  { key: 'sidebar' as const, label: 'Sidebar' },
  { key: 'panel' as const, label: 'Main panel' },
  { key: 'card' as const, label: 'Cards' },
  { key: 'elevated' as const, label: 'Raised surfaces' },
  { key: 'border' as const, label: 'Dividers' },
];

const textFields = [
  { key: 'foreground' as const, label: 'Primary text' },
  { key: 'muted' as const, label: 'Secondary text', picker: false },
];

function PaletteEditor({
  palette,
  onChange,
  onReset,
  onResetTheme,
}: {
  palette: ThemePalette;
  onChange: (patch: Partial<ThemePalette>) => void;
  onReset: () => void;
  onResetTheme: () => void;
}) {
  const [gradientOpen, setGradientOpen] = useState(palette.gradientEnabled);

  return (
    <div className="space-y-5">
      <div className="h-20 rounded-xl" style={{ background: presetShellBackground(palette) }} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className={cn('text-xs font-medium uppercase tracking-wide', admin.muted)}>Surfaces</p>
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'inline-flex items-center gap-1 text-xs transition-colors',
              admin.muted,
              admin.hoverRow,
              'rounded-md px-2 py-1',
            )}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {surfaceFields.map(({ key, label }) => (
            <SwatchInput
              key={key}
              id={`surface-${key}`}
              label={label}
              value={palette[key]}
              onChange={(v) => onChange({ [key]: v })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className={cn('mb-3 text-xs font-medium uppercase tracking-wide', admin.muted)}>Text</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {textFields.map(({ key, label, picker = true }) => (
            <SwatchInput
              key={key}
              id={`text-${key}`}
              label={label}
              value={palette[key]}
              picker={picker}
              onChange={(v) => onChange({ [key]: v })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className={cn('mb-3 text-xs font-medium uppercase tracking-wide', admin.muted)}>Accent</p>
        <SwatchInput
          id="accent"
          label="Buttons and highlights"
          value={palette.accent}
          onChange={(accent) => onChange({ accent })}
        />
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 sm:flex-row sm:justify-between',
          palette.gradientEnabled && gradientOpen ? 'sm:items-start' : 'sm:items-center',
        )}
      >
        <div className={cn('w-full sm:max-w-md rounded-xl p-4', admin.elevated)}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={cn('text-sm font-medium', admin.fg)}>Background gradient</p>
              <p className={cn('mt-0.5 text-xs', admin.muted)}>Optional wash behind the panel</p>
            </div>
            <Toggle
              id="gradient-enabled"
              checked={palette.gradientEnabled}
              onChange={(gradientEnabled) => {
                onChange({ gradientEnabled });
                if (gradientEnabled) setGradientOpen(true);
              }}
            />
          </div>

          {palette.gradientEnabled && (
            <button
              type="button"
              onClick={() => setGradientOpen((v) => !v)}
              className={cn(
                'mt-3 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors',
                admin.hoverRow,
                admin.muted,
              )}
            >
              Gradient stops
              <ChevronDown className={cn('h-4 w-4 transition-transform', gradientOpen && 'rotate-180')} />
            </button>
          )}

          {palette.gradientEnabled && gradientOpen && (
            <div className="mt-3 space-y-3">
              <SwatchInput
                id="grad-from"
                label="Start color"
                value={palette.gradientFrom}
                onChange={(gradientFrom) => onChange({ gradientFrom })}
              />
              <SwatchInput
                id="grad-to"
                label="End color"
                value={palette.gradientTo}
                onChange={(gradientTo) => onChange({ gradientTo })}
              />
              <div>
                <label htmlFor="grad-angle" className={cn('text-xs', admin.muted)}>
                  Angle | {palette.gradientAngle}°
                </label>
                <input
                  id="grad-angle"
                  type="range"
                  min={0}
                  max={360}
                  value={palette.gradientAngle}
                  onChange={(e) => onChange({ gradientAngle: Number(e.currentTarget.value) })}
                  className="mt-2 w-full accent-[var(--admin-accent)]"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onResetTheme}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium leading-none transition-colors cursor-pointer select-none shrink-0 self-end sm:self-auto',
            palette.gradientEnabled && gradientOpen && 'sm:mt-3',
            admin.muted,
            admin.hoverRow,
          )}
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Restore defaults</span>
        </button>
      </div>
    </div>
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
    themePresets.find((preset) => palettesMatch(preset.dark, dark) && palettesMatch(preset.light, light))?.id ?? null;

  const activePalette = mode === 'dark' ? dark : light;
  const updateActive = mode === 'dark' ? updateDark : updateLight;
  const resetActive = mode === 'dark' ? resetDarkPalette : resetLightPalette;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-medium', admin.fg)}>Color mode</p>
          <p className={cn('mt-0.5 text-xs', admin.muted)}>Which palette the panel uses right now</p>
        </div>

        <div className={cn('flex w-full sm:w-auto rounded-lg p-1', admin.elevated)}>
          {(['dark', 'light'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                'flex-1 sm:flex-none rounded-md px-4 py-1.5 text-sm capitalize transition-colors',
                mode === option ? admin.accentPill : cn(admin.muted, admin.hoverRow),
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={cn('text-sm font-medium', admin.fg)}>Presets</p>
        <p className={cn('mt-0.5 text-xs', admin.muted)}>Pick a starting point. Preview shows {mode} mode.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {themePresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              mode={mode}
              active={activePresetId === preset.id}
              onApply={() => applyPreset(preset)}
            />
          ))}
        </div>
      </div>

      <div className={cn('h-px bg-[color-mix(in_srgb,var(--admin-fg)_8%,transparent)]')} />

      <div>
        <p className={cn('text-sm font-medium', admin.fg)}>Custom {mode} colors</p>
        <p className={cn('mt-0.5 text-xs', admin.muted)}>
          Tweaks apply to {mode} mode only. Switch above to edit the other.
        </p>
        <div className="mt-4">
          <PaletteEditor
            palette={activePalette}
            onChange={updateActive}
            onReset={resetActive}
            onResetTheme={resetTheme}
          />
        </div>
      </div>
    </div>
  );
}
