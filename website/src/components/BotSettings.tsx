import { AnimatePresence, m } from '@/lib/panel-motion';
import { Check, Code2, Copy, Plus, RotateCcw, Search, Sliders, Trash2, X } from '@/components/icons';
import { useEffect, useState } from 'preact/compat';
import { createPortal } from 'preact/compat';
import { BotSettingsSkeleton } from '@/components/SectionSkeleton';
import { UnsavedChangesBar } from '@/components/UnsavedChangesBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { addConfigItem, deleteConfigItem, fetchFullConfig, getCache, resetConfigItem, updateConfigItem } from '@/lib/api';
import { quickTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

type ViewMode = 'visual' | 'json';
type FieldType = 'string' | 'number' | 'boolean' | 'array';

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!obj || typeof obj !== 'object') return result;
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

function resolveRootAndPath(rawPath: string): { root: 'config' | 'keywords'; path: string; parent?: string; key: string } {
  let root: 'config' | 'keywords' = 'config';
  let path = rawPath;
  if (path.startsWith('keywords.')) {
    root = 'keywords';
    path = path.slice('keywords.'.length);
  } else if (path.startsWith('config.')) {
    path = path.slice('config.'.length);
  }
  const parts = path.split('.');
  const key = parts[parts.length - 1];
  const parent = parts.length > 1 ? parts.slice(0, -1).join('.') : undefined;
  return { root, path, parent, key };
}

function formatKeyName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getKeyDescription(key: string): string {
  const k = key.toLowerCase();
  if (k === 'name') return 'The official display name of your Discord bot instance';
  if (k === 'version') return 'Current version tag of the deployed bot build';
  if (k === 'description') return 'Public summary describing the bot purpose and features';
  if (k.includes('rarity')) return 'Defined rarity tiers available for items and spawns';
  if (k.includes('cooldown')) return 'Delay duration in seconds between automated events';
  if (k.includes('prefix')) return 'Default command prefix symbol used for text triggers';
  if (k.includes('channel')) return 'Configured Discord channel ID for broadcast notifications';
  if (k.includes('limit') || k.includes('max')) return 'Maximum limit constraint applied to operations';
  return `Configures the ${formatKeyName(key)} parameter for bot operations`;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
  return result;
}

function deleteNestedValue(
  obj: Record<string, unknown>,
  path: string[]
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      return result;
    }
    current = current[key] as Record<string, unknown>;
  }
  delete current[path[path.length - 1]];
  return result;
}

interface SectionOption {
  id: string;
  label: string;
}

interface NewFieldModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    sectionTarget: string,
    newSectionName: string,
    fieldKey: string,
    value: unknown
  ) => void;
  availableSections: SectionOption[];
  defaultSection?: string;
}

function NewFieldModal({
  open,
  onClose,
  onAdd,
  availableSections,
  defaultSection = 'general',
}: NewFieldModalProps) {
  const [sectionTarget, setSectionTarget] = useState(defaultSection);
  const [newSectionName, setNewSectionName] = useState('');
  const [keyName, setKeyName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('string');
  const [initialValue, setInitialValue] = useState('');
  const hoverFeedback = useMotionPref('hoverFeedback');

  useEffect(() => {
    if (open) {
      setSectionTarget(defaultSection || 'general');
      setNewSectionName('');
    }
  }, [open, defaultSection]);

  if (typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    if (sectionTarget === '__new__' && !newSectionName.trim()) return;

    const cleanKey = keyName.trim();
    let val: unknown = initialValue;

    if (fieldType === 'number') {
      val = Number(initialValue) || 0;
    } else if (fieldType === 'boolean') {
      val = initialValue === 'true';
    } else if (fieldType === 'array') {
      val = initialValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    onAdd(sectionTarget, newSectionName.trim(), cleanKey, val);
    setKeyName('');
    setNewSectionName('');
    setInitialValue('');
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-md bg-[var(--admin-panel)] rounded-2xl p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--admin-fg)]">
                  Add Setting Field
                </h3>
                <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                  Select a section and create a custom parameter
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--admin-muted)]">
                  Target Section
                </label>
                <select name="sectiontarget"
                  value={sectionTarget}
                  onChange={(e) => setSectionTarget(e.currentTarget.value)}
                  className="w-full h-10 rounded-xl bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs px-3 focus:outline-none cursor-pointer border-0"
                >
                  {availableSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label}
                    </option>
                  ))}
                  <option value="__new__">+ Create New Section…</option>
                </select>
              </div>

              {sectionTarget === '__new__' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--admin-muted)]">
                    New Section Name
                  </label>
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.currentTarget.value)}
                    placeholder="e.g. economy or discord"
                    omitDefaults="rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-10 text-[var(--admin-fg)] rounded-xl border-0"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--admin-muted)]">
                  Field Key Name
                </label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.currentTarget.value)}
                  placeholder="e.g. spawn_cooldown"
                  omitDefaults="rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-10 text-[var(--admin-fg)] rounded-xl border-0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--admin-muted)]">
                  Data Type
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-[var(--admin-elevated)]">
                  {(['string', 'number', 'boolean', 'array'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFieldType(type);
                        if (type === 'boolean') setInitialValue('true');
                        else setInitialValue('');
                      }}
                      className={cn(
                        'py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer',
                        fieldType === type
                          ? 'bg-[var(--admin-accent)] text-[var(--admin-accent-fg)]'
                          : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--admin-muted)]">
                  Initial Value
                </label>
                {fieldType === 'boolean' ? (
                  <select name="initialvalue"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.currentTarget.value)}
                    className="w-full h-10 rounded-xl bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs px-3 focus:outline-none cursor-pointer border-0"
                  >
                    <option value="true">Enabled (true)</option>
                    <option value="false">Disabled (false)</option>
                  </select>
                ) : fieldType === 'array' ? (
                  <Input
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.currentTarget.value)}
                    placeholder="Comma separated values (e.g. common, rare)"
                    omitDefaults="rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-10 text-[var(--admin-fg)] rounded-xl border-0"
                  />
                ) : (
                  <Input
                    type={fieldType === 'number' ? 'number' : 'text'}
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.currentTarget.value)}
                    placeholder="Enter value"
                    omitDefaults="rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-10 text-[var(--admin-fg)] rounded-xl border-0"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  omitDefaults="rounded-md text-sm rounded-md" className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <m.button
                  type="submit"
                  whileTap={hoverFeedback ? { scale: 0.96 } : undefined}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] transition-colors cursor-pointer"
                >
                  Add Field
                </m.button>
              </div>
            </form>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface SettingRowProps {
  fieldKey: string;
  value: unknown;
  path: string[];
  onUpdate: (path: string[], val: unknown) => void;
  onDelete: (path: string[]) => void;
  onReset?: (path: string[]) => void;
  removable?: boolean;
}

function SettingRow({
  fieldKey,
  value,
  path,
  onUpdate,
  onDelete,
  onReset,
  removable = true,
}: SettingRowProps) {
  const isArray = Array.isArray(value);
  const isBoolean = typeof value === 'boolean';
  const isNumber = typeof value === 'number';
  const isString = typeof value === 'string';

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 first:pt-0 last:pb-0">
      <div className="space-y-1 sm:max-w-xs md:max-w-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--admin-fg)]">
            {formatKeyName(fieldKey)}
          </span>
          {removable && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--admin-elevated)] text-[var(--admin-muted)] font-medium">
              Custom
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--admin-muted)] leading-relaxed">
          {getKeyDescription(fieldKey)}
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-72 md:w-80 shrink-0 justify-end">
        <div className="flex-1 min-w-0">
          {isBoolean ? (
            <div className="flex items-center justify-end gap-3 py-1">
              <span className="text-xs font-medium text-[var(--admin-muted)] capitalize">
                {value ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(value)}
                onClick={() => onUpdate(path, !value)}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer',
                  value ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-elevated)]'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform bg-white shadow-sm',
                    value ? 'translate-x-5' : 'translate-x-0 opacity-60'
                  )}
                />
              </button>
            </div>
          ) : isArray ? (
            <div className="w-full space-y-2">
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-[var(--admin-elevated)]">
                {(value as unknown[]).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--admin-card)] text-xs font-medium text-[var(--admin-fg)]"
                  >
                    {String(item)}
                    <button
                      type="button"
                      onClick={() => {
                        const next = (value as unknown[]).filter((_, i) => i !== idx);
                        onUpdate(path, next);
                      }}
                      className="text-[var(--admin-muted)] hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id={`tag-input-${path.join('-')}`}
                  placeholder="Add item…"
                  omitDefaults="h-10 rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-9 text-[var(--admin-fg)] flex-1 rounded-xl border-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        onUpdate(path, [...(value as unknown[]), input.value.trim()]);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(
                      `tag-input-${path.join('-')}`
                    ) as HTMLInputElement | null;
                    if (input && input.value.trim()) {
                      onUpdate(path, [...(value as unknown[]), input.value.trim()]);
                      input.value = '';
                    }
                  }}
                  className="h-9 px-3 rounded-xl bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ) : isNumber ? (
            <Input
              type="number"
              value={Number(value)}
              onChange={(e) => onUpdate(path, Number(e.currentTarget.value))}
              omitDefaults="rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-10 text-[var(--admin-fg)] rounded-xl w-full border-0"
            />
          ) : isString && (value as string).length > 60 ? (
            <textarea name="string-value"
              rows={3}
              value={String(value)}
              onChange={(e) => onUpdate(path, e.currentTarget.value)}
              className="w-full p-3 rounded-xl bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs focus:outline-none resize-none leading-relaxed border-0"
            />
          ) : (
            <Input
              type="text"
              value={String(value ?? '')}
              onChange={(e) => onUpdate(path, e.currentTarget.value)}
              omitDefaults="rounded-md text-sm" className="bg-[var(--admin-elevated)] text-xs h-10 text-[var(--admin-fg)] rounded-xl w-full border-0"
            />
          )}
        </div>

        {removable ? (
          <button
            type="button"
            onClick={() => onDelete(path)}
            className="p-2 rounded-xl text-[var(--admin-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
            title="Remove setting"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : onReset ? (
          <button
            type="button"
            onClick={() => onReset(path)}
            className="p-2 rounded-xl text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)] transition-colors shrink-0 cursor-pointer"
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function BotSettings() {
  const [config, setConfig] = useState<Record<string, unknown>>(() => {
    return getCache<Record<string, unknown>>('config_raw') || {
      name: 'Nationdex',
      version: '1.0.0',
      description:
        'Collect nations on Discord and enjoy an OG environment of peace and freedom!',
      rarityClasses: ['common', 'uncommon', 'rare', 'mythic', 'legendary'],
    };
  });

  const [initialConfig, setInitialConfig] = useState<Record<string, unknown>>(config);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCache<Record<string, unknown>>('config_raw'));
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(config, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetSectionForModal, setTargetSectionForModal] = useState('general');

  const hoverFeedback = useMotionPref('hoverFeedback');
  const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);

  useEffect(() => {
    let active = true;
    void fetchFullConfig()
      .then((data) => {
        if (active && data && typeof data === 'object') {
          setConfig(data);
          setInitialConfig(data);
          setJsonText(JSON.stringify(data, null, 2));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return <BotSettingsSkeleton />;
  }

  const handleUpdateNested = (path: string[], val: unknown) => {
    const updated = setNestedValue(config, path, val);
    setConfig(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setJsonError(null);
  };

  const handleDeleteNested = (path: string[]) => {
    const updated = deleteNestedValue(config, path);
    setConfig(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setConfig(parsed);
        setJsonError(null);
      } else {
        setJsonError('JSON must be a key-value object');
      }
    } catch {
      setJsonError('Invalid JSON syntax');
    }
  };

  const handleSave = async () => {
    if (jsonError) return;
    setIsSaving(true);
    try {
      const prevFlat = flattenObject(initialConfig);
      const currFlat = flattenObject(config);

      const tasks: Promise<unknown>[] = [];

      for (const [key, currVal] of Object.entries(currFlat)) {
        const { root, path, parent, key: itemKey } = resolveRootAndPath(key);
        if (!(key in prevFlat)) {
          tasks.push(addConfigItem(root, itemKey, currVal, parent));
        } else if (JSON.stringify(prevFlat[key]) !== JSON.stringify(currVal)) {
          tasks.push(updateConfigItem(root, path, currVal));
        }
      }

      for (const [key] of Object.entries(prevFlat)) {
        if (!(key in currFlat)) {
          const { root, path } = resolveRootAndPath(key);
          tasks.push(deleteConfigItem(root, path));
        }
      }

      await Promise.allSettled(tasks);
      setInitialConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetRow = async (pathSegments: string[]) => {
    const rawPath = pathSegments.join('.');
    const { root, path } = resolveRootAndPath(rawPath);
    const res = await resetConfigItem(root, path);
    if (res && res.ok !== false) {
      const fresh = await fetchFullConfig();
      if (fresh) {
        setConfig(fresh);
        setInitialConfig(fresh);
        setJsonText(JSON.stringify(fresh, null, 2));
      }
    }
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setJsonText(JSON.stringify(initialConfig, null, 2));
    setJsonError(null);
  };

  const handleCopyJson = () => {
    void navigator.clipboard.writeText(jsonText);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const openAddFieldModal = (sectionId = 'general') => {
    setTargetSectionForModal(sectionId);
    setModalOpen(true);
  };

  const handleAddFieldSubmit = (
    sectionTarget: string,
    newSectionName: string,
    fieldKey: string,
    val: unknown
  ) => {
    let resolvedSection = sectionTarget;
    if (sectionTarget === '__new__') {
      if (!newSectionName.trim()) return;
      resolvedSection = newSectionName.trim().toLowerCase().replace(/\s+/g, '_');
    }

    if (resolvedSection === 'general') {
      handleUpdateNested([fieldKey], val);
    } else if (resolvedSection === 'info') {
      if ('info' in config && typeof config.info === 'object' && config.info !== null) {
        handleUpdateNested(['info', fieldKey], val);
      } else {
        handleUpdateNested([fieldKey], val);
      }
    } else if (resolvedSection === 'rarity') {
      if (Array.isArray(config.rarityClasses)) {
        handleUpdateNested(['rarityClasses'], [...(config.rarityClasses as unknown[]), String(val)]);
      } else {
        handleUpdateNested(['rarityClasses', fieldKey], val);
      }
    } else {
      handleUpdateNested([resolvedSection, fieldKey], val);
    }
  };

  const generalKeys = ['name', 'version', 'description'];
  const rarityKeys = ['rarityClasses', 'rarity_classes'];

  const botInfoEntries: Array<{ key: string; val: unknown; path: string[] }> = [];

  if ('info' in config && typeof config.info === 'object' && config.info !== null) {
    const infoObj = config.info as Record<string, unknown>;
    Object.entries(infoObj).forEach(([k, v]) => {
      botInfoEntries.push({ key: k, val: v, path: ['info', k] });
    });
  }

  generalKeys.forEach((k) => {
    if (k in config && typeof config[k] !== 'object') {
      botInfoEntries.push({ key: k, val: config[k], path: [k] });
    }
  });

  const rarityEntries: Array<{ key: string; val: unknown; path: string[] }> = [];
  rarityKeys.forEach((k) => {
    if (k in config) {
      rarityEntries.push({ key: k, val: config[k], path: [k] });
    }
  });

  const processedTopKeys = new Set(['info', ...generalKeys, ...rarityKeys]);

  const primitiveEntries: Array<{ key: string; val: unknown; path: string[] }> = [];
  const objectSections: Array<{ sectionKey: string; items: Array<{ key: string; val: unknown; path: string[] }> }> = [];

  Object.entries(config).forEach(([key, val]) => {
    if (processedTopKeys.has(key)) return;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const items = Object.entries(val as Record<string, unknown>).map(([ck, cv]) => ({
        key: ck,
        val: cv,
        path: [key, ck],
      }));
      objectSections.push({ sectionKey: key, items });
    } else {
      primitiveEntries.push({ key, val, path: [key] });
    }
  });

  const availableSections: SectionOption[] = [
    { id: 'general', label: 'Configuration Parameters' },
    { id: 'info', label: 'Bot Information' },
    { id: 'rarity', label: 'Rarity & Tiers' },
    ...objectSections.map((sec) => ({
      id: sec.sectionKey,
      label: `${formatKeyName(sec.sectionKey)} Settings`,
    })),
  ];

  const filterMatches = (key: string, val: unknown) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (key.toLowerCase().includes(q)) return true;
    if (typeof val === 'string' && val.toLowerCase().includes(q)) return true;
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val).toLowerCase().includes(q);
    }
    return false;
  };

  const visibleBotInfo = botInfoEntries.filter((e) => filterMatches(e.key, e.val));
  const visibleRarity = rarityEntries.filter((e) => filterMatches(e.key, e.val));
  const visiblePrimitives = primitiveEntries.filter((e) => filterMatches(e.key, e.val));
  const visibleObjects = objectSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((e) => filterMatches(e.key, e.val)),
    }))
    .filter((sec) => sec.items.length > 0 || filterMatches(sec.sectionKey, ''));

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] tracking-tight">
            Bot Settings
          </h2>
          <p className="text-xs sm:text-sm text-[var(--admin-muted)] mt-1">
            Manage bot parameters, and dynamic options
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 flex-nowrap">
          <div className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-[var(--admin-elevated)] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={cn(
                'relative px-2 sm:px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap',
                viewMode === 'visual'
                  ? 'text-[var(--admin-accent-fg)]'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
              )}
            >
              {viewMode === 'visual' && (
                <m.span
                  className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                  transition={quickTransition}
                />
              )}
              <Sliders className="h-3.5 w-3.5 relative z-10 shrink-0" />
              <span className="relative z-10 whitespace-nowrap">Form View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={cn(
                'relative px-2 sm:px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap',
                viewMode === 'json'
                  ? 'text-[var(--admin-accent-fg)]'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
              )}
            >
              {viewMode === 'json' && (
                <m.span
                  className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                  transition={quickTransition}
                />
              )}
              <Code2 className="h-3.5 w-3.5 relative z-10 shrink-0" />
              <span className="relative z-10 whitespace-nowrap">Raw JSON</span>
            </button>
          </div>

          <m.button
            type="button"
            onClick={() => openAddFieldModal('general')}
            whileTap={hoverFeedback ? { scale: 0.96 } : undefined}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 text-[var(--admin-accent)] shrink-0" />
            <span className="whitespace-nowrap">Add Field</span>
          </m.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'visual' ? (
          <m.div
            key="visual-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--admin-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                placeholder="Filter parameters by name or value…"
                omitDefaults="rounded-md text-sm" className="pl-9 bg-[var(--admin-card)] text-xs h-10 text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] rounded-xl border-0"
              />
            </div>

            {visibleBotInfo.length > 0 && (
              <Card omitDefaults="rounded-lg" className="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none">
                <CardContent omitDefaults="p-6 pt-0" className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-[var(--admin-border)] flex-nowrap min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--admin-fg)] whitespace-nowrap truncate min-w-0">
                      Bot Information
                    </h3>

                    <button
                      type="button"
                      onClick={() => openAddFieldModal('info')}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Plus className="h-3 w-3 text-[var(--admin-accent)] shrink-0" />
                      <span className="whitespace-nowrap">Add Field</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--admin-border)]">
                    {visibleBotInfo.map((entry) => (
                      <SettingRow
                        key={entry.path.join('.')}
                        fieldKey={entry.key}
                        value={entry.val}
                        path={entry.path}
                        onUpdate={handleUpdateNested}
                        onDelete={handleDeleteNested}
                        onReset={handleResetRow}
                        removable={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {visibleRarity.length > 0 && (
              <Card omitDefaults="rounded-lg" className="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none">
                <CardContent omitDefaults="p-6 pt-0" className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-[var(--admin-border)] flex-nowrap min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--admin-fg)] whitespace-nowrap truncate min-w-0">
                      Rarity &amp; Tiers
                    </h3>

                    <button
                      type="button"
                      onClick={() => openAddFieldModal('rarity')}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Plus className="h-3 w-3 text-[var(--admin-accent)] shrink-0" />
                      <span className="whitespace-nowrap">Add Field</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--admin-border)]">
                    {visibleRarity.map((entry) => (
                      <SettingRow
                        key={entry.path.join('.')}
                        fieldKey={entry.key}
                        value={entry.val}
                        path={entry.path}
                        onUpdate={handleUpdateNested}
                        onDelete={handleDeleteNested}
                        onReset={handleResetRow}
                        removable={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {visiblePrimitives.length > 0 && (
              <Card omitDefaults="rounded-lg" className="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none">
                <CardContent omitDefaults="p-6 pt-0" className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-[var(--admin-border)] flex-nowrap min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--admin-fg)] whitespace-nowrap truncate min-w-0">
                      Configuration Parameters
                    </h3>

                    <button
                      type="button"
                      onClick={() => openAddFieldModal('general')}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Plus className="h-3 w-3 text-[var(--admin-accent)] shrink-0" />
                      <span className="whitespace-nowrap">Add Field</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--admin-border)]">
                    {visiblePrimitives.map((entry) => (
                      <SettingRow
                        key={entry.path.join('.')}
                        fieldKey={entry.key}
                        value={entry.val}
                        path={entry.path}
                        onUpdate={handleUpdateNested}
                        onDelete={handleDeleteNested}
                        onReset={handleResetRow}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {visibleObjects.map((sec) => (
              <Card key={sec.sectionKey} omitDefaults="rounded-lg" className="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none">
                <CardContent omitDefaults="p-6 pt-0" className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-[var(--admin-border)] flex-nowrap min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--admin-fg)] whitespace-nowrap truncate min-w-0">
                      {formatKeyName(sec.sectionKey)} Settings
                    </h3>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openAddFieldModal(sec.sectionKey)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Plus className="h-3 w-3 text-[var(--admin-accent)] shrink-0" />
                        <span className="whitespace-nowrap">Add Field</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNested([sec.sectionKey])}
                        className="p-1.5 rounded-xl text-[var(--admin-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--admin-border)]">
                    {sec.items.map((entry) => (
                      <SettingRow
                        key={entry.path.join('.')}
                        fieldKey={entry.key}
                        value={entry.val}
                        path={entry.path}
                        onUpdate={handleUpdateNested}
                        onDelete={handleDeleteNested}
                        onReset={handleResetRow}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </m.div>
        ) : (
          <m.div
            key="json-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold px-3 py-1 rounded-full',
                    jsonError
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  )}
                >
                  {jsonError || 'Valid JSON'}
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyJson}
                omitDefaults="rounded-md text-sm rounded-md" className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)] rounded-full"
              >
                {copiedJson ? (
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copiedJson ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>

            <Card omitDefaults="rounded-lg" className="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none overflow-hidden">
              <CardContent omitDefaults="p-6 pt-0" className="p-4">
                <textarea name="jsontext"
                  rows={18}
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.currentTarget.value)}
                  className="w-full text-xs bg-transparent text-[var(--admin-fg)] focus:outline-none resize-none leading-relaxed font-sans"
                />
              </CardContent>
            </Card>
          </m.div>
        )}
      </AnimatePresence>

      <NewFieldModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        availableSections={availableSections}
        defaultSection={targetSectionForModal}
        onAdd={handleAddFieldSubmit}
      />

      <UnsavedChangesBar
        show={isDirty}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        message="Careful, you have unsaved changes!"
        onReset={handleReset}
        onSave={handleSave}
      />
    </div>
  );
}