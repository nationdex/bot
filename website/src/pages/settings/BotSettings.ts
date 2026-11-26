import { BotFieldValue } from './BotFieldValue';
import { BotJsonEditor } from './BotJsonEditor';
import { NewFieldDialog, type SectionOption } from './NewFieldDialog';
import { PanelUnsavedChanges } from '@/components/feedback/PanelUnsavedChanges';
import {
  addConfigItem,
  deleteConfigItem,
  fetchFullConfig,
  getCache,
  resetConfigItem,
  updateConfigItem,
} from '@/lib/api';

type ViewMode = 'visual' | 'json';

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null);
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

function resolveRootAndPath(rawPath: string): {
  root: 'config' | 'keywords';
  path: string;
  parent?: string;
  key: string;
} {
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

function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!Object.hasOwn(current, key) || !current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
  return result;
}

function deleteNestedValue(obj: Record<string, unknown>, path: string[]): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!Object.hasOwn(current, key) || !current[key] || typeof current[key] !== 'object') {
      return result;
    }
    current = current[key] as Record<string, unknown>;
  }
  delete current[path[path.length - 1]];
  return result;
}

type Entry = { key: string; val: unknown; path: string[] };

const toolbar = document.createElement('template');
toolbar.innerHTML = `
<div class="w-full space-y-4 sm:space-y-6">
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div><h2 class="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] tracking-tight">Bot Settings</h2>
      <p class="text-xs sm:text-sm text-[var(--admin-muted)] mt-1">Manage bot parameters, and dynamic options</p></div>
    <div class="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 flex-nowrap">
      <div class="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-[var(--admin-elevated)] shrink-0">
        ${[
          ['visual', 'Form View'],
          ['json', 'Raw JSON'],
        ]
          .map(
            ([id, label]) =>
              `<button type="button" data-mode="${id}" class="relative px-2 sm:px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap"><span data-highlight class="absolute inset-0 rounded-full bg-[var(--admin-accent)]"></span>${id === 'visual' ? '<svg class="h-3.5 w-3.5 relative z-10 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 8h4"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M17 16h4"></path><path d="M19 12V3"></path><path d="M19 21v-5"></path><path d="M3 14h4"></path><path d="M5 10V3"></path><path d="M5 21v-7"></path></svg>' : '<svg class="h-3.5 w-3.5 relative z-10 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>'}<span class="relative z-10">${label}</span></button>`,
          )
          .join('')}
      </div>
      <button type="button" data-add class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"><svg class="h-3.5 w-3.5 text-[var(--admin-accent)] shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg><span>Add Field</span></button>
    </div>
  </div>
  <p data-status role="status" class="text-sm text-[var(--admin-muted)]" hidden></p>
  <div data-visual class="space-y-5">
    <div class="relative max-w-sm"><svg class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--admin-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg><input aria-label="Filter parameters" placeholder="Filter parameters by name or value…" class="w-full pl-9 px-3 py-2 bg-[var(--admin-card)] text-xs h-10 text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] rounded-xl border-0"></div>
    <div data-sections class="space-y-5"></div>
  </div>
</div>`;

const sectionTemplate = document.createElement('template');
sectionTemplate.innerHTML = `
<div class="bg-[var(--admin-card)] rounded-2xl border-0 shadow-none">
  <div class="p-4 sm:p-6 space-y-4">
    <div class="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-[var(--admin-border)] flex-nowrap min-w-0">
      <h3 class="text-xs sm:text-sm font-bold text-[var(--admin-fg)] whitespace-nowrap truncate min-w-0"></h3>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" data-add class="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer whitespace-nowrap"><svg class="h-3.5 w-3.5 text-[var(--admin-accent)] shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg><span>Add Field</span></button>
        <button type="button" data-remove title="Remove section" class="p-1.5 rounded-xl text-[var(--admin-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><svg class="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
    </div>
    <div data-rows class="divide-y divide-[var(--admin-border)]"></div>
  </div>
</div>`;

const rowTemplate = document.createElement('template');
rowTemplate.innerHTML = `
<div class="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 first:pt-0 last:pb-0">
  <div class="space-y-1 sm:max-w-xs md:max-w-sm">
    <div class="flex items-center gap-2"><span data-name class="text-sm font-semibold text-[var(--admin-fg)]"></span><span data-custom class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--admin-elevated)] text-[var(--admin-muted)] font-medium">Custom</span></div>
    <p class="text-xs text-[var(--admin-muted)] leading-relaxed"></p>
  </div>
  <div class="flex items-center gap-3 w-full sm:w-72 md:w-80 shrink-0 justify-end">
    <div data-value class="flex-1 min-w-0"></div>
    <button type="button" class="p-2 rounded-xl text-[var(--admin-muted)] hover:bg-[var(--admin-elevated)] transition-colors shrink-0 cursor-pointer"></button>
  </div>
</div>`;

export class BotSettingsPage extends HTMLElement {
  private config = getCache<Record<string, unknown>>('config_raw') ?? {};
  private initialConfig = this.config;
  private jsonText = JSON.stringify(this.config, null, 2);
  private jsonError: string | null = null;
  private invalidJson = false;
  private searchQuery = '';
  private isSaving = false;
  private saveSuccess = false;
  private copiedJson = false;
  private modalOpen = false;
  private targetSectionForModal = 'general';
  private availableSections: SectionOption[] = [];
  private mode: ViewMode = 'visual';
  private copyTimer?: ReturnType<typeof setTimeout>;
  private saveTimer?: ReturnType<typeof setTimeout>;
  private loading = true;
  private loadError = false;
  private readonly json = new BotJsonEditor();
  private readonly dialog = new NewFieldDialog();
  private readonly unsaved = new PanelUnsavedChanges();
  private sections = new Map<string, HTMLElement>();
  private rows = new Map<string, { element: HTMLElement; value: BotFieldValue }>();

  connectedCallback() {
    this.style.display = 'contents';
    this.replaceChildren(toolbar.content.cloneNode(true), this.dialog, this.unsaved);
    this.sections.clear();
    this.rows.clear();
    this.querySelector('[data-visual]')!.after(this.json);
    this.querySelector('[data-add]')!.addEventListener('click', () => this.openAddFieldModal());
    const search = this.querySelector('input')!;
    search.value = this.searchQuery;
    search.addEventListener('input', () => {
      this.searchQuery = search.value;
      this.render();
    });
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      button.addEventListener('click', () => {
        this.mode = button.dataset.mode as ViewMode;
        this.render();
      });
    }
    this.render();
    void fetchFullConfig()
      .then((data) => {
        if (!this.isConnected) return;
        this.loadError = !data;
        if (data && !Array.isArray(data)) {
          const config = structuredClone(data);
          if (config.bot && typeof config.bot === 'object') delete (config.bot as Record<string, unknown>).version;
          delete config.version;
          this.config = this.initialConfig = config;
          this.jsonText = JSON.stringify(config, null, 2);
        }
      })
      .catch(() => {
        this.loadError = true;
      })
      .finally(() => {
        this.loading = false;
        this.render();
      });
  }

  disconnectedCallback() {
    clearTimeout(this.copyTimer);
    clearTimeout(this.saveTimer);
  }

  private readonly handleUpdateNested = (path: string[], val: unknown) => {
    if (path.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) return;
    const updated = setNestedValue(this.config, path, val);
    this.config = updated;
    this.jsonText = JSON.stringify(updated, null, 2);
    this.jsonError = null;
    this.invalidJson = false;
    this.render();
  };

  private readonly handleDeleteNested = (path: string[]) => {
    if (path.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) return;
    const updated = deleteNestedValue(this.config, path);
    this.config = updated;
    this.jsonText = JSON.stringify(updated, null, 2);
    this.jsonError = null;
    this.invalidJson = false;
    this.render();
  };

  private readonly handleJsonChange = (text: string) => {
    this.jsonText = text;
    this.invalidJson = false;
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this.config = parsed;
        this.jsonError = null;
        this.invalidJson = false;
      } else {
        this.invalidJson = true;
        this.jsonError = 'JSON must be a key-value object';
      }
    } catch {
      this.invalidJson = true;
      this.jsonError = 'Invalid JSON syntax';
    }
    this.render();
  };

  private readonly handleSave = async () => {
    if (this.invalidJson || this.isSaving) return;
    const saving = this.config;
    this.isSaving = true;
    this.render();
    try {
      const prevFlat = flattenObject(this.initialConfig);
      const currFlat = flattenObject(saving);

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

      const results = await Promise.allSettled(tasks);
      if (
        results.some(
          (r) =>
            r.status === 'rejected' ||
            (r.status === 'fulfilled' && (!r.value || (r.value as { ok?: boolean }).ok === false)),
        )
      ) {
        this.jsonError = 'Some settings could not be saved. Reload and retry.';
        return;
      }
      this.initialConfig = saving;
      this.saveSuccess = true;
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.saveSuccess = false;
        this.render();
      }, 2500);
    } finally {
      this.isSaving = false;
      this.render();
    }
  };

  private readonly handleResetRow = async (pathSegments: string[]) => {
    const rawPath = pathSegments.join('.');
    const { root, path } = resolveRootAndPath(rawPath);
    const res = await resetConfigItem(root, path);
    if (res && res.ok !== false) {
      const fresh = await fetchFullConfig();
      if (fresh) {
        this.config = fresh;
        this.initialConfig = fresh;
        this.jsonText = JSON.stringify(fresh, null, 2);
      }
    }
    this.render();
  };

  private readonly handleReset = () => {
    this.config = this.initialConfig;
    this.jsonText = JSON.stringify(this.initialConfig, null, 2);
    this.jsonError = null;
    this.invalidJson = false;
    this.render();
  };

  private readonly handleCopyJson = () => {
    void navigator.clipboard
      .writeText(this.jsonText)
      .then(() => {
        this.copiedJson = true;
        this.render();
        clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copiedJson = false;
          this.render();
        }, 2000);
      })
      .catch(() => {});
  };

  private readonly openAddFieldModal = (sectionId = 'general') => {
    this.targetSectionForModal = sectionId;
    this.modalOpen = true;
    this.render();
  };

  private readonly handleAddFieldSubmit = (
    sectionTarget: string,
    newSectionName: string,
    fieldKey: string,
    val: unknown,
  ) => {
    let resolvedSection = sectionTarget;
    if (sectionTarget === '__new__') {
      if (!newSectionName.trim()) return;
      resolvedSection = newSectionName.trim().toLowerCase().replace(/\s+/g, '_');
    }

    if (resolvedSection === 'general') {
      this.handleUpdateNested([fieldKey], val);
    } else if (resolvedSection === 'info') {
      if ('info' in this.config && typeof this.config.info === 'object' && this.config.info !== null) {
        this.handleUpdateNested(['info', fieldKey], val);
      } else {
        this.handleUpdateNested([fieldKey], val);
      }
    } else if (resolvedSection === 'rarity') {
      if (Array.isArray(this.config.rarityClasses)) {
        this.handleUpdateNested(['rarityClasses'], [...(this.config.rarityClasses as unknown[]), String(val)]);
      } else {
        this.handleUpdateNested(['rarityClasses', fieldKey], val);
      }
    } else {
      this.handleUpdateNested([resolvedSection, fieldKey], val);
    }
  };

  private render() {
    if (!this.isConnected) return;
    const status = this.querySelector<HTMLElement>('[data-status]')!;
    const error = this.mode === 'visual' || !this.invalidJson ? this.jsonError : null;
    status.textContent = this.loading ? 'Loading…' : this.loadError ? 'Could not load bot settings.' : (error ?? '');
    status.hidden = !status.textContent;
    this.querySelector<HTMLButtonElement>('[data-add]')!.disabled = this.loading || this.loadError || this.isSaving;
    this.querySelector<HTMLElement>('[data-visual]')!.hidden = this.mode !== 'visual' || this.loading || this.loadError;
    this.json.hidden = this.mode !== 'json' || this.loading || this.loadError;
    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      const active = button.dataset.mode === this.mode;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector<HTMLElement>('[data-highlight]')!.hidden = !active;
      button.classList.toggle('text-[var(--admin-accent-fg)]', active);
      button.classList.toggle('text-[var(--admin-muted)]', !active);
    }
    this.json.state = {
      text: this.jsonText,
      error: this.jsonError,
      copied: this.copiedJson,
      onChange: this.handleJsonChange,
      onCopy: this.handleCopyJson,
    };
    this.renderSections();
    this.dialog.state = {
      open: this.modalOpen,
      onClose: () => {
        this.modalOpen = false;
        this.render();
      },
      availableSections: this.availableSections,
      defaultSection: this.targetSectionForModal,
      onAdd: this.handleAddFieldSubmit,
    };
    this.unsaved.update({
      show: this.saveSuccess || this.invalidJson || JSON.stringify(this.config) !== JSON.stringify(this.initialConfig),
      isSaving: this.isSaving,
      saveSuccess: this.saveSuccess,
      onReset: this.handleReset,
      onSave: this.handleSave,
    });
  }

  private renderSections() {
    const generalKeys = ['name', 'version', 'description'];
    const rarityKeys = ['rarityClasses', 'rarity_classes'];

    const botInfoEntries: Array<{ key: string; val: unknown; path: string[] }> = [];

    if ('info' in this.config && typeof this.config.info === 'object' && this.config.info !== null) {
      const infoObj = this.config.info as Record<string, unknown>;
      Object.entries(infoObj).forEach(([k, v]) => {
        botInfoEntries.push({ key: k, val: v, path: ['info', k] });
      });
    }

    generalKeys.forEach((k) => {
      if (k in this.config && typeof this.config[k] !== 'object') {
        botInfoEntries.push({ key: k, val: this.config[k], path: [k] });
      }
    });

    const rarityEntries: Array<{ key: string; val: unknown; path: string[] }> = [];
    rarityKeys.forEach((k) => {
      if (k in this.config) {
        rarityEntries.push({ key: k, val: this.config[k], path: [k] });
      }
    });

    const processedTopKeys = new Set(['info', ...generalKeys, ...rarityKeys]);

    const primitiveEntries: Array<{ key: string; val: unknown; path: string[] }> = [];
    const objectSections: Array<{ sectionKey: string; items: Array<{ key: string; val: unknown; path: string[] }> }> =
      [];

    Object.entries(this.config).forEach(([key, val]) => {
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

    this.availableSections = [
      { id: 'general', label: 'Configuration Parameters' },
      { id: 'info', label: 'Bot Information' },
      { id: 'rarity', label: 'Rarity & Tiers' },
      ...objectSections.map((sec) => ({
        id: sec.sectionKey,
        label: `${formatKeyName(sec.sectionKey)} Settings`,
      })),
    ];

    const filterMatches = (key: string, val: unknown) => {
      if (!this.searchQuery.trim()) return true;
      const q = this.searchQuery.toLowerCase();
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

    const container = this.querySelector('[data-sections]')!;
    const visible = [
      { id: 'info', title: 'Bot Information', entries: visibleBotInfo, custom: false },
      { id: 'rarity', title: 'Rarity & Tiers', entries: visibleRarity, custom: false },
      { id: 'general', title: 'Configuration Parameters', entries: visiblePrimitives, custom: false },
    ].filter((section) => section.entries.length > 0);
    visible.push(
      ...visibleObjects.map(({ sectionKey, items }) => ({
        id: sectionKey,
        title: formatKeyName(sectionKey) + ' Settings',
        entries: items,
        custom: true,
      })),
    );
    const used = new Set<string>();
    const activeSections = new Set<HTMLElement>();
    visible.forEach(({ id, title, entries, custom }, index) => {
      const key = JSON.stringify([id, custom]);
      let section = this.sections.get(key);
      if (!section) {
        section = sectionTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
        section.querySelector('h3')!.textContent = title;
        section.querySelector('[data-add]')!.addEventListener('click', () => this.openAddFieldModal(id));
        const remove = section.querySelector<HTMLButtonElement>('[data-remove]')!;
        remove.hidden = !custom;
        remove.addEventListener('click', () => this.handleDeleteNested([id]));
        this.sections.set(key, section);
      }
      activeSections.add(section);
      if (container.children[index] !== section) container.insertBefore(section, container.children[index] ?? null);
      const rows = section.querySelector('[data-rows]')!;
      entries.forEach((entry, position) => {
        const rowKey = JSON.stringify(entry.path);
        used.add(rowKey);
        let row = this.rows.get(rowKey);
        if (!row) {
          row = this.createRow(entry, custom || id === 'general');
          this.rows.set(rowKey, row);
        }
        if (rows.children[position] !== row.element) rows.insertBefore(row.element, rows.children[position] ?? null);
        row.value.state = {
          label: formatKeyName(entry.key),
          value: entry.val,
          change: (next) => this.handleUpdateNested(entry.path, next),
        };
      });
    });
    for (const [key, row] of this.rows) {
      if (!used.has(key)) {
        row.element.remove();
        this.rows.delete(key);
      }
    }
    for (const [key, section] of this.sections) {
      if (!activeSections.has(section)) {
        section.remove();
        this.sections.delete(key);
      }
    }
  }

  private createRow(entry: Entry, removable: boolean) {
    const element = rowTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
    element.querySelector('[data-name]')!.textContent = formatKeyName(entry.key);
    element.querySelector<HTMLElement>('[data-custom]')!.hidden = !removable;
    element.querySelector('p')!.textContent = getKeyDescription(entry.key);
    const button = element.querySelector('button')!;
    button.title = removable ? 'Remove setting' : 'Reset to default';
    button.innerHTML = removable
      ? '<svg class="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
      : '<svg class="h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';
    button.addEventListener('click', () => {
      if (removable) this.handleDeleteNested(entry.path);
      else void this.handleResetRow(entry.path);
    });
    const value = new BotFieldValue();
    element.querySelector('[data-value]')!.append(value);
    return { element, value };
  }
}

customElements.define('pnd-bot-settings', BotSettingsPage);
