import fs from 'fs';
import path from 'path';
import { DataBase } from '@nationdex/db/dist/util';
import { variables as defaults } from '../config/variables';

// Data layer behind the staff panel: catalog, card assets, user data and bot config.
// Every function validates its input and returns a result object instead of throwing on user mistakes.

const pg = () => (DataBase as any).pg;

export interface Result<T = unknown> {
  ok: boolean;
  error?: string;
  value?: T;
}
const fail = <T = unknown>(error: string): Result<T> => ({ ok: false, error });
const done = <T>(value?: T): Result<T> => ({ ok: true, value });

// Snapshot of the shipped defaults, taken before the database values are merged in.
const BASE = {
  config: JSON.parse(JSON.stringify(defaults.config)),
  keywords: JSON.parse(JSON.stringify(defaults.keywords)),
} as const;

const SNOWFLAKE = /^\d{15,25}$/;
const CLASS_NAME = /^[a-z][a-z0-9_-]{1,19}$/;
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// ---------- storage helpers ----------

function parse<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readVar<T>(name: string, type: string, id: string | undefined, fallback: T): Promise<T> {
  const row = await DataBase.get({ name, type, ...(id ? { id } : {}) } as any);
  return parse<T>(row?.value, fallback);
}

async function writeVar(name: string, type: string, id: string | undefined, value: unknown): Promise<void> {
  await DataBase.set({ name, type, ...(id ? { id } : {}), value: JSON.stringify(value) } as any);
}

// One writer at a time inside this process.
let chain: Promise<unknown> = Promise.resolve();
export function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

// ---------- config (the "settings" panel) ----------

export type ConfigRoot = 'config' | 'keywords';
export const CONFIG_ROOTS: ConfigRoot[] = ['config', 'keywords'];

export async function getConfigRoot(root: ConfigRoot): Promise<Record<string, any>> {
  const stored = await readVar<Record<string, any> | null>(root, 'custom', undefined, null);
  const live = (defaults as any)[root];
  return stored && typeof stored === 'object' ? stored : JSON.parse(JSON.stringify(live ?? BASE[root]));
}

export interface ConfigLeaf {
  path: string;
  value: string;
  custom: boolean;
}

function walk(node: any, base: any, prefix: string, out: ConfigLeaf[]): void {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    const value = node[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) walk(value, base?.[key], full, out);
    else out.push({ path: full, value: String(value ?? ''), custom: !(base && typeof base === 'object' && key in base) });
  }
}

export async function listConfig(root: ConfigRoot): Promise<ConfigLeaf[]> {
  const tree = await getConfigRoot(root);
  const out: ConfigLeaf[] = [];
  walk(tree, BASE[root], '', out);
  return out;
}

function validateConfigValue(root: ConfigRoot, pathKey: string, value: string): string | null {
  const v = value.trim();
  const last = (pathKey.split('.').pop() ?? '');
  if (v.length > 300) return 'The value is too long (300 characters max).';
  if (root === 'config') {
    if (pathKey === 'accent' && !/^#[0-9a-fA-F]{6}$/.test(v)) return 'The accent must be a hex colour like #4000ff.';
    if (pathKey === 'prefix' && !/^\S{1,5}$/.test(v)) return 'The prefix must be 1-5 characters without spaces.';
    if (pathKey === 'logChannel' && v && !SNOWFLAKE.test(v)) return 'The log channel must be a channel ID or empty.';
    if (pathKey.startsWith('paths.')) {
      if (!v || path.isAbsolute(v) || v.split(/[\\/]/).includes('..')) return 'Paths must be relative and cannot contain "..".';
    }
    if ((pathKey.startsWith('urls.') || last === 'profile' || last === 'repo') && !/^https?:\/\/\S+$/.test(v)) return 'That must be a full http(s) URL.';
    if (pathKey === 'bot.name' && (!v || v.length > 32)) return 'The bot name must be 1-32 characters.';
  } else {
    if (!v || v.length > 32) return 'Keywords must be 1-32 characters.';
  }
  return null;
}

async function saveConfig(root: ConfigRoot, tree: Record<string, any>): Promise<void> {
  await writeVar(root, 'custom', undefined, tree);
  const live = (defaults as any)[root];
  if (live && typeof live === 'object') {
    for (const key of Object.keys(live)) delete live[key];
    Object.assign(live, JSON.parse(JSON.stringify(tree)));
  }
}

export function setConfigValue(root: ConfigRoot, pathKey: string, value: string): Promise<Result> {
  return exclusive(async () => {
    const err = validateConfigValue(root, pathKey, value);
    if (err) return fail(err);
    const tree = await getConfigRoot(root);
    const keys = pathKey.split('.');
    let node: any = tree;
    for (const k of keys.slice(0, -1)) {
      node = node?.[k];
      if (!node || typeof node !== 'object') return fail('That setting does not exist.');
    }
    const leaf = keys[keys.length - 1];
    if (!(leaf in node) || (node[leaf] && typeof node[leaf] === 'object')) return fail('That setting does not exist.');
    node[leaf] = value.trim();
    await saveConfig(root, tree);
    return done();
  });
}

export function addConfigKey(root: ConfigRoot, parent: string, key: string, value: string): Promise<Result> {
  return exclusive(async () => {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(key)) return fail('Keys use letters, numbers and underscores (32 max).');
    if (value.length > 300) return fail('The value is too long (300 characters max).');
    const tree = await getConfigRoot(root);
    let node: any = tree;
    if (parent) {
      for (const k of parent.split('.')) {
        node = node?.[k];
        if (!node || typeof node !== 'object' || Array.isArray(node)) return fail('That group does not exist.');
      }
    }
    if (key in node) return fail('That key already exists.');
    node[key] = value.trim();
    await saveConfig(root, tree);
    return done();
  });
}

export function deleteConfigKey(root: ConfigRoot, pathKey: string): Promise<Result> {
  return exclusive(async () => {
    const tree = await getConfigRoot(root);
    const keys = pathKey.split('.');
    let base: any = BASE[root];
    for (const k of keys) base = base?.[k];
    if (base !== undefined) return fail('Built-in settings cannot be deleted, only edited.');
    let node: any = tree;
    for (const k of keys.slice(0, -1)) node = node?.[k];
    const leaf = keys[keys.length - 1];
    if (!node || !(leaf in node)) return fail('That setting does not exist.');
    delete node[leaf];
    await saveConfig(root, tree);
    return done();
  });
}

export function resetConfigKey(root: ConfigRoot, pathKey: string): Promise<Result> {
  return exclusive(async () => {
    const keys = pathKey.split('.');
    let base: any = BASE[root];
    for (const k of keys) base = base?.[k];
    if (base === undefined || (base && typeof base === 'object')) return fail('Only built-in settings can be reset.');
    const tree = await getConfigRoot(root);
    let node: any = tree;
    for (const k of keys.slice(0, -1)) node = node?.[k];
    if (!node) return fail('That setting does not exist.');
    node[keys[keys.length - 1]] = base;
    await saveConfig(root, tree);
    return done();
  });
}

const cfgPath = (kind: 'cards' | 'icons' | 'window_art' | 'spawn_art'): string => String((defaults.config as any).paths?.[kind] ?? BASE.config.paths[kind]);

// ---------- catalog ----------

export interface Catalog {
  classes: string[];
  total: number;
  total_caught: number;
  collectibles: Record<string, Record<string, any>>;
  [key: string]: any;
}

export async function getCatalog(): Promise<Catalog> {
  const c = await readVar<Catalog>('collectiblesData', 'custom', undefined, JSON.parse(JSON.stringify(defaults.collectiblesData)) as any);
  c.collectibles ??= {};
  c.classes ??= [];
  return c;
}

const saveCatalog = (c: Catalog) => writeVar('collectiblesData', 'custom', undefined, c);

export type FieldKind = 'text' | 'int' | 'list';
export interface NationField {
  key: string;
  label: string;
  kind: FieldKind;
  max: number;
  optional?: boolean;
  min?: number;
  paragraph?: boolean;
}

// Editable catalog fields grouped by the modal that shows them (max five inputs per modal).
export const NATION_GROUPS: Record<string, { title: string; fields: NationField[] }> = {
  basic: {
    title: 'Name and emoji',
    fields: [
      { key: 'name', label: 'Name', kind: 'text', max: 48 },
      { key: 'short_name', label: 'Short name (cards)', kind: 'text', max: 24, optional: true },
      { key: 'emoji_id', label: 'Application emoji ID or name', kind: 'text', max: 64 },
      { key: 'credits', label: 'Artist credit', kind: 'text', max: 64, optional: true },
    ],
  },
  stats: {
    title: 'Power and health',
    fields: [
      { key: 'attack', label: 'Power (attack)', kind: 'int', max: 6, min: 0 },
      { key: 'health', label: 'Health', kind: 'int', max: 6, min: 0 },
      { key: 'rarity', label: 'Spawn weight (rarity)', kind: 'int', max: 6, min: 1 },
      { key: 'price', label: 'Buy price', kind: 'int', max: 9, min: 0 },
      { key: 'sell_price', label: 'Sell price', kind: 'int', max: 9, min: 0 },
    ],
  },
  ability: {
    title: 'Capacity and description',
    fields: [
      { key: 'capacity_name', label: 'Capacity name', kind: 'text', max: 48, optional: true },
      { key: 'capacity_description', label: 'Description', kind: 'text', max: 400, optional: true, paragraph: true },
    ],
  },
  names: {
    title: 'Catch names',
    fields: [
      { key: 'catch_names', label: 'Catch names (comma separated)', kind: 'list', max: 300, paragraph: true },
      { key: 'translations', label: 'Translations (comma separated)', kind: 'list', max: 300, optional: true, paragraph: true },
    ],
  },
};

const ALL_FIELDS = Object.values(NATION_GROUPS).flatMap((g) => g.fields);
export const fieldByKey = (key: string) => ALL_FIELDS.find((f) => f.key === key);

const toList = (raw: string) => Array.from(new Set(raw.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)));

function coerce(field: NationField, raw: string): Result<any> {
  const v = raw.trim();
  if (!v) return field.optional ? done(field.kind === 'list' ? [] : field.kind === 'int' ? 0 : '') : fail(`${field.label} is required.`);
  if (field.kind === 'int') {
    if (!/^\d+$/.test(v)) return fail(`${field.label} must be a whole number.`);
    const n = parseInt(v, 10);
    if (field.min !== undefined && n < field.min) return fail(`${field.label} must be at least ${field.min}.`);
    if (n > 999_999_999) return fail(`${field.label} is too large.`);
    return done(n);
  }
  if (field.kind === 'list') return done(toList(v));
  return done(v);
}

function aliasClash(catalog: Catalog, names: string[], ownId: string | null): string | null {
  for (const [id, c] of Object.entries(catalog.collectibles)) {
    if (id === ownId) continue;
    const taken = new Set([...(c.catch_names ?? []), ...(c.translations ?? [])].map((a: string) => String(a).toLowerCase()));
    const hit = names.find((n) => taken.has(n));
    if (hit) return `The catch name "${hit}" is already used by #${id}.`;
  }
  return null;
}

export interface NationRow {
  id: string;
  name: string;
  class: string;
  emoji_id: string;
}

export async function listNations(query = ''): Promise<NationRow[]> {
  const c = await getCatalog();
  const q = query.trim().toLowerCase();
  return Object.entries(c.collectibles)
    .map(([id, n]) => ({ id, name: String(n.name ?? ''), class: String(n.class ?? ''), emoji_id: String(n.emoji_id ?? '') }))
    .filter((n) => !q || n.name.toLowerCase().includes(q) || n.id === q)
    .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
}

export async function getNation(id: string): Promise<Record<string, any> | null> {
  return (await getCatalog()).collectibles[id] ?? null;
}

export interface NewNation {
  name: string;
  class: string;
  attack: string;
  health: string;
  rarity: string;
  emoji_id: string;
}

export function addNation(input: NewNation): Promise<Result<string>> {
  return exclusive(async () => {
    const c = await getCatalog();
    const name = input.name.trim();
    if (!name || name.length > 48) return fail('The name must be 1-48 characters.');
    if (!c.classes.includes(input.class)) return fail(`Unknown category: ${input.class}`);
    const lower = name.toLowerCase();
    if (Object.values(c.collectibles).some((n) => String(n.name ?? '').toLowerCase() === lower)) return fail(`A nation named ${name} already exists.`);
    const stats: Record<string, number> = {};
    for (const key of ['attack', 'health', 'rarity'] as const) {
      const f = fieldByKey(key)!;
      const r = coerce(f, input[key]);
      if (!r.ok) return r as Result<string>;
      stats[key] = r.value as number;
    }
    const emoji = input.emoji_id.trim();
    if (!emoji || emoji.length > 64) return fail('The emoji is required (an application emoji ID or name).');
    const clash = aliasClash(c, [lower], null);
    if (clash) return fail(clash);
    const regimes = listCardBackgrounds();
    const id = String(Object.keys(c.collectibles).map((k) => parseInt(k, 10)).filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0) + 1);
    c.collectibles[id] = {
      class: input.class,
      rarity: stats.rarity,
      weight: stats.rarity,
      name,
      short_name: null,
      regime: regimes[0] ?? '',
      economy: listIcons()[0] ?? '',
      collection_card: '',
      wild_card: '',
      capacity_name: '',
      capacity_description: '',
      credits: '',
      attack: stats.attack,
      health: stats.health,
      emoji_id: emoji,
      translations: [],
      catch_names: [lower],
      global_caught: 0,
      price: 0,
      sell_price: 0,
    };
    c.total = Object.keys(c.collectibles).length;
    c[input.class] = (Number(c[input.class]) || 0) + 1;
    await saveCatalog(c);
    return done(id);
  });
}

export function editNation(id: string, patch: Record<string, string>): Promise<Result<{ recomputed: number }>> {
  return exclusive(async () => {
    const c = await getCatalog();
    const nation = c.collectibles[id];
    if (!nation) return fail('That nation no longer exists.') as Result<{ recomputed: number }>;
    const next: Record<string, any> = {};
    for (const [key, raw] of Object.entries(patch)) {
      const f = fieldByKey(key);
      if (!f) return fail(`Unknown field: ${key}`) as Result<{ recomputed: number }>;
      const r = coerce(f, raw);
      if (!r.ok) return r as Result<{ recomputed: number }>;
      next[key] = r.value;
    }
    if (typeof next.name === 'string') {
      const lower = next.name.toLowerCase();
      if (Object.entries(c.collectibles).some(([k, n]) => k !== id && String(n.name ?? '').toLowerCase() === lower)) {
        return fail(`A nation named ${next.name} already exists.`) as Result<{ recomputed: number }>;
      }
    }
    if (next.catch_names !== undefined || next.translations !== undefined) {
      const names = [...(next.catch_names ?? nation.catch_names ?? []), ...(next.translations ?? nation.translations ?? [])];
      if (!(next.catch_names ?? nation.catch_names ?? []).length) return fail('At least one catch name is required.') as Result<{ recomputed: number }>;
      const clash = aliasClash(c, names, id);
      if (clash) return fail(clash) as Result<{ recomputed: number }>;
    }
    if ('short_name' in next && next.short_name === '') next.short_name = null;
    const weightChanged = 'rarity' in next && next.rarity !== nation.rarity;
    if ('rarity' in next) next.weight = next.rarity;
    Object.assign(nation, next);
    await saveCatalog(c);
    const recomputed = weightChanged ? await recomputeOwners(id) : 0;
    return done({ recomputed });
  });
}

// Moves a nation to another category (class) and fixes the counts everywhere.
export function setNationClass(id: string, cls: string): Promise<Result<{ recomputed: number }>> {
  return exclusive(async () => {
    const c = await getCatalog();
    const nation = c.collectibles[id];
    if (!nation) return fail('That nation no longer exists.') as Result<{ recomputed: number }>;
    if (!c.classes.includes(cls)) return fail(`Unknown category: ${cls}`) as Result<{ recomputed: number }>;
    if (nation.class === cls) return done({ recomputed: 0 });
    c[nation.class] = Math.max((Number(c[nation.class]) || 0) - 1, 0);
    c[cls] = (Number(c[cls]) || 0) + 1;
    nation.class = cls;
    await saveCatalog(c);
    return done({ recomputed: await recomputeOwners(id) });
  });
}

export function setNationAsset(id: string, key: 'regime' | 'economy', file: string): Promise<Result> {
  return exclusive(async () => {
    const c = await getCatalog();
    const nation = c.collectibles[id];
    if (!nation) return fail('That nation no longer exists.');
    const list = key === 'regime' ? listCardBackgrounds() : listIcons();
    if (!list.includes(file)) return fail(`No such ${key === 'regime' ? 'card background' : 'icon'}: ${file}`);
    nation[key] = file;
    await saveCatalog(c);
    return done();
  });
}

// ---------- categories ----------

export function addClass(name: string): Promise<Result> {
  return exclusive(async () => {
    const n = name.trim().toLowerCase();
    if (!CLASS_NAME.test(n)) return fail('Category names are 2-20 lowercase letters, numbers, - or _.');
    const c = await getCatalog();
    if (c.classes.includes(n)) return fail('That category already exists.');
    if (['total', 'total_caught', 'classes', 'collectibles'].includes(n)) return fail('That name is reserved.');
    c.classes.push(n);
    c[n] = 0;
    await saveCatalog(c);
    // existing inventories need the new counter so catches can increment it
    const rows = await pg().query("SELECT identifier, value FROM record WHERE name = 'userCollectibles' AND type = 'user'");
    for (const row of rows.rows) {
      const inv = parse<Record<string, any>>(row.value, {});
      if (!(n in inv)) {
        inv[n] = 0;
        await pg().query('UPDATE record SET value = $1 WHERE identifier = $2', [JSON.stringify(inv), row.identifier]);
      }
    }
    return done();
  });
}

export function deleteClass(name: string): Promise<Result> {
  return exclusive(async () => {
    const c = await getCatalog();
    if (!c.classes.includes(name)) return fail('That category does not exist.');
    if (c.classes.length <= 1) return fail('The last category cannot be deleted.');
    const used = Object.values(c.collectibles).filter((n) => n.class === name).length;
    if (used) return fail(`${used} nation(s) still use this category. Move them first.`);
    c.classes = c.classes.filter((x) => x !== name);
    delete c[name];
    await saveCatalog(c);
    return done();
  });
}

// ---------- catches, inventories ----------

interface Inventory {
  total: number;
  total_value: number;
  unique: Array<string | number>;
  collectibleIDs: string[];
  [key: string]: any;
}

const emptyInventory = (classes: string[]): Inventory => {
  const inv: Inventory = { total: 0, total_value: 0, unique: [], collectibleIDs: [] };
  for (const cls of classes) inv[cls] = 0;
  return inv;
};

async function catchRows(ids: string[]): Promise<Map<string, Record<string, any>>> {
  const out = new Map<string, Record<string, any>>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const identifiers = chunk.map((id) => DataBase.make_intetifier({ type: 'old', name: 'collectible', id } as any));
    const res = await pg().query(
      `SELECT identifier, value FROM record WHERE identifier IN (${identifiers.map((_, k) => `$${k + 1}`).join(',')})`,
      identifiers,
    );
    const byIdentifier = new Map<string, string>(res.rows.map((r: any) => [r.identifier, r.value]));
    chunk.forEach((id, k) => {
      const v = byIdentifier.get(identifiers[k]);
      if (v) out.set(id, parse(v, {}));
    });
  }
  return out;
}

// Rebuilds a user's counters from the catches in their inventory.
async function recomputeUser(userId: string, catalog?: Catalog): Promise<void> {
  const c = catalog ?? (await getCatalog());
  const inv = await readVar<Inventory>('userCollectibles', 'user', userId, emptyInventory(c.classes));
  const ids = (inv.collectibleIDs ?? []).map(String);
  const rows = await catchRows(ids);
  const next = emptyInventory(c.classes);
  const unique = new Set<string>();
  for (const id of ids) {
    const row = rows.get(id);
    if (!row) continue;
    const nation = c.collectibles[String(row.id)];
    if (!nation) continue;
    next.collectibleIDs.push(id);
    next.total += 1;
    next.total_value += Number(nation.weight) || 0;
    next[nation.class] = (Number(next[nation.class]) || 0) + 1;
    unique.add(String(row.id));
  }
  next.unique = [...unique];
  await writeVar('userCollectibles', 'user', userId, next);
}

async function ownersOf(nationId: string): Promise<string[]> {
  const rows = await pg().query("SELECT id, value FROM record WHERE name = 'userCollectibles' AND type = 'user'");
  const owners: string[] = [];
  for (const row of rows.rows) {
    const inv = parse<Inventory>(row.value, emptyInventory([]));
    if ((inv.unique ?? []).map(String).includes(nationId)) owners.push(String(row.id));
  }
  return owners;
}

async function recomputeOwners(nationId: string): Promise<number> {
  const c = await getCatalog();
  const owners = await ownersOf(nationId);
  for (const id of owners) await recomputeUser(id, c);
  return owners.length;
}

async function auctionedCatches(nationId?: string): Promise<string[]> {
  const house = await readVar<{ auctions?: Record<string, any> }>('auctionHouse', 'custom', undefined, {});
  return Object.values(house.auctions ?? {})
    .filter((a: any) => a && (nationId === undefined || String(a.colID) === nationId))
    .map((a: any) => String(a.nation));
}

export async function countCatches(nationId: string): Promise<number> {
  const res = await pg().query(
    "SELECT count(*)::int AS n FROM record WHERE type = 'old' AND name = 'collectible' AND value::jsonb->>'id' = $1",
    [nationId],
  );
  return res.rows[0]?.n ?? 0;
}

export function deleteNation(id: string, cascade: boolean): Promise<Result<{ catches: number }>> {
  return exclusive(async () => {
    const c = await getCatalog();
    const nation = c.collectibles[id];
    if (!nation) return fail('That nation no longer exists.') as Result<{ catches: number }>;
    if ((await auctionedCatches(id)).length) return fail('Active auctions hold this nation. Cancel them first.') as Result<{ catches: number }>;
    const catches = await countCatches(id);
    if (catches && !cascade) return { ok: false, error: `${catches} catch(es) of this nation exist.`, value: { catches } };
    const owners = catches ? await ownersOf(id) : [];
    if (catches) {
      await pg().query("DELETE FROM record WHERE type = 'old' AND name = 'collectible' AND value::jsonb->>'id' = $1", [id]);
    }
    delete c.collectibles[id];
    c.total = Object.keys(c.collectibles).length;
    c[nation.class] = Math.max((Number(c[nation.class]) || 0) - 1, 0);
    await saveCatalog(c);
    for (const owner of owners) await recomputeUser(owner, c);
    return done({ catches });
  });
}

// ---------- card assets ----------

const listPng = (dir: string): string[] => {
  try {
    return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).map((f) => f.slice(0, -4)).sort();
  } catch {
    return [];
  }
};
export const listCardBackgrounds = (): string[] => listPng(cfgPath('cards'));
// economy icons are stored with their extension in the catalog
export const listIcons = (): string[] => {
  try {
    return fs.readdirSync(cfgPath('icons')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  } catch {
    return [];
  }
};

function pngSize(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

export async function downloadImage(url: string): Promise<Result<Buffer>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fail('Could not download the file.');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) return fail('The file is larger than 10 MB.');
    return done(buf);
  } catch {
    return fail('Could not download the file.');
  }
}

export function addCardBackground(name: string, data: Buffer): Promise<Result> {
  return exclusive(async () => {
    const n = name.trim();
    if (!FILE_NAME.test(n)) return fail('Names use letters, numbers, - and _ (40 max).');
    const size = pngSize(data);
    if (!size) return fail('The file must be a PNG image.');
    if (size.w !== 1428 || size.h !== 2000) return fail(`Card backgrounds must be 1428x2000 pixels (this one is ${size.w}x${size.h}).`);
    const dir = cfgPath('cards');
    if (fs.existsSync(path.join(dir, `${n}.png`))) return fail('A background with that name already exists.');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${n}.png`), data);
    return done();
  });
}

export function deleteCardBackground(name: string): Promise<Result> {
  return exclusive(async () => {
    if (!listCardBackgrounds().includes(name)) return fail('That background does not exist.');
    const c = await getCatalog();
    const users = Object.entries(c.collectibles).filter(([, n]) => n.regime === name).map(([id]) => `#${id}`);
    if (users.length) return fail(`Still used by ${users.slice(0, 8).join(', ')}${users.length > 8 ? '...' : ''}. Change those nations first.`);
    const specials = await readVar<Record<string, any>>('specials', 'custom', undefined, {});
    if (Object.values(specials).some((s: any) => s && String(s.card ?? '').replace(/\.png$/, '') === name)) return fail('A special uses this background.');
    fs.rmSync(path.join(cfgPath('cards'), `${name}.png`));
    return done();
  });
}

// ---------- users ----------

export interface UserOverview {
  balance: number;
  total: number;
  total_value: number;
  unique: number;
  settings: Record<string, string>;
  stats: Record<string, number>;
}

export async function userOverview(userId: string): Promise<UserOverview> {
  const c = await getCatalog();
  const inv = await readVar<Inventory>('userCollectibles', 'user', userId, emptyInventory(c.classes));
  const settings = { ...(defaults.settings as Record<string, string>), ...(await readVar<Record<string, string>>('settings', 'user', userId, {})) };
  const stats = { ...(defaults.userStats as Record<string, number>), ...(await readVar<Record<string, number>>('userStats', 'user', userId, {})) };
  const balance = Number(await readVar<number>('balance', 'user', userId, 0)) || 0;
  return { balance, total: inv.total ?? 0, total_value: inv.total_value ?? 0, unique: (inv.unique ?? []).length, settings, stats };
}

export function userExists(userId: string): boolean {
  return SNOWFLAKE.test(userId);
}

export function editBalance(userId: string, mode: 'set' | 'add' | 'remove', amount: string): Promise<Result<number>> {
  return exclusive(async () => {
    if (!/^\d{1,12}$/.test(amount.trim())) return fail('The amount must be a whole number (up to 12 digits).') as Result<number>;
    const n = parseInt(amount, 10);
    const cur = Number(await readVar<number>('balance', 'user', userId, 0)) || 0;
    const next = mode === 'set' ? n : mode === 'add' ? cur + n : Math.max(cur - n, 0);
    if (next > 999_999_999_999) return fail('That balance is too large.') as Result<number>;
    await writeVar('balance', 'user', userId, next);
    return done(next);
  });
}

export const SETTING_KEYS: Record<string, string[]> = {
  inventory_privacy: ['public', 'private'],
  profile_privacy: ['public', 'private'],
  accept_gifts: ['true', 'false'],
};

export function setUserSetting(userId: string, key: string, value: string): Promise<Result> {
  return exclusive(async () => {
    if (!SETTING_KEYS[key]?.includes(value)) return fail('Invalid setting.');
    const cur = await readVar<Record<string, string>>('settings', 'user', userId, {});
    cur[key] = value;
    await writeVar('settings', 'user', userId, { ...(defaults.settings as Record<string, string>), ...cur });
    return done();
  });
}

export function resetUserSettings(userId: string): Promise<Result> {
  return exclusive(async () => {
    await DataBase.delete({ name: 'settings', type: 'user', id: userId } as any);
    return done();
  });
}

export const STAT_KEYS = Object.keys(defaults.userStats);

export function setUserStat(userId: string, key: string, value: string): Promise<Result> {
  return exclusive(async () => {
    if (!STAT_KEYS.includes(key)) return fail('Unknown stat.');
    if (!/^\d{1,9}$/.test(value.trim())) return fail('The value must be a whole number.');
    const cur = await readVar<Record<string, number>>('userStats', 'user', userId, {});
    await writeVar('userStats', 'user', userId, { ...(defaults.userStats as Record<string, number>), ...cur, [key]: parseInt(value, 10) });
    return done();
  });
}

const ID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function newCatchId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => ID_CHARS[b % 36]).join('');
}

export function giveNation(userId: string, nationId: string, count: number): Promise<Result<string[]>> {
  return exclusive(async () => {
    const c = await getCatalog();
    const nation = c.collectibles[nationId];
    if (!nation) return fail('That nation does not exist.') as Result<string[]>;
    if (!Number.isInteger(count) || count < 1 || count > 25) return fail('Give between 1 and 25 at a time.') as Result<string[]>;
    const inv = await readVar<Inventory>('userCollectibles', 'user', userId, emptyInventory(c.classes));
    const created: string[] = [];
    for (let i = 0; i < count; i++) {
      let id = newCatchId();
      while (await DataBase.get({ name: 'collectible', type: 'old', id } as any)) id = newCatchId();
      await DataBase.set({
        name: 'collectible',
        type: 'old',
        id,
        value: JSON.stringify({
          id: nationId,
          author: userId,
          attack: String(nation.attack),
          health: String(nation.health),
          attack_type: 'buffed',
          health_type: 'buffed',
          special: '',
          card: `${nation.regime}.png`,
          timestamp: String(Date.now()),
          caught_in: '0',
        }),
      } as any);
      inv.collectibleIDs = [...(inv.collectibleIDs ?? []), id];
      created.push(id);
    }
    await writeVar('userCollectibles', 'user', userId, inv);
    await recomputeUser(userId, c);
    c.collectibles[nationId].global_caught = (Number(nation.global_caught) || 0) + count;
    c.total_caught = (Number(c.total_caught) || 0) + count;
    await saveCatalog(c);
    return done(created);
  });
}

export function removeCatch(userId: string, catchId: string): Promise<Result> {
  return exclusive(async () => {
    const id = catchId.trim().toUpperCase();
    if (!/^[0-9A-Z]{7}$/.test(id)) return fail('Catch IDs are 7 characters (letters and numbers).');
    const c = await getCatalog();
    const inv = await readVar<Inventory>('userCollectibles', 'user', userId, emptyInventory(c.classes));
    if (!(inv.collectibleIDs ?? []).map(String).includes(id)) return fail('That user does not hold that catch.');
    if ((await auctionedCatches()).includes(id)) return fail('That catch is in an active auction.');
    inv.collectibleIDs = inv.collectibleIDs.filter((x) => String(x) !== id);
    await writeVar('userCollectibles', 'user', userId, inv);
    await DataBase.delete({ name: 'collectible', type: 'old', id } as any);
    await recomputeUser(userId, c);
    return done();
  });
}

export async function listUserCatches(userId: string, page: number, size = 20): Promise<{ rows: Array<{ id: string; nation: string; name: string }>; pages: number; total: number }> {
  const c = await getCatalog();
  const inv = await readVar<Inventory>('userCollectibles', 'user', userId, emptyInventory(c.classes));
  const ids = (inv.collectibleIDs ?? []).map(String);
  const pages = Math.max(Math.ceil(ids.length / size), 1);
  const slice = ids.slice((page - 1) * size, page * size);
  const rows = await catchRows(slice);
  return {
    rows: slice.map((id) => ({ id, nation: String(rows.get(id)?.id ?? ''), name: String(c.collectibles[String(rows.get(id)?.id)]?.name ?? 'Unknown') })),
    pages,
    total: ids.length,
  };
}
