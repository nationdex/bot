import { mkdir, readFile, rename, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ForgeClient } from '@tryforge/forgescript';
const panelStore = require('../../website/server/db') as { getMeta: (key: string) => Promise<string | null> };

// Extras execute trusted code with the bot's privileges. Installation requires explicit panel approval.
interface CatalogueEntry { id: string; repository: string; ref: string }
interface ExtrasSettings { enabled: boolean; allowedOrigins: string[]; catalogue: CatalogueEntry[] }
interface InstalledExtra extends CatalogueEntry { entrypoint: string; enabled: boolean }
interface ExtraManifest { id: string; entrypoint: string; apiVersion: number }
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
const commit = /^[a-f0-9]{40}$/;
const repositoryPart = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,98}[A-Za-z0-9])?$/;
const validRepository = (value: unknown): value is string => typeof value === 'string' && value.length <= 201 && value.split('/').length === 2 && value.split('/').every(part => repositoryPart.test(part));
const validOrigin = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 255) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && url.origin === value && !url.username && !url.password; } catch { return false; }
};
const root = (): string => path.resolve('data/extras');
const settingsKey = 'remote_extras_settings';
let mutating = false;
const loaded = new Set<string>();

async function state(): Promise<InstalledExtra[]> {
  try {
    const value: unknown = JSON.parse(await readFile(path.join(root(), 'installed.json'), 'utf8'));
    if (!Array.isArray(value) || !value.every(item => item && validId(item.id) && validRepository(item.repository) && commit.test(item.ref) && safeEntry(item.entrypoint) && typeof item.enabled === 'boolean')) throw new Error('Invalid extras state');
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
function safeEntry(entry: unknown): entry is string {
  return typeof entry === 'string' && /\.(?:ts|js|mjs)$/.test(entry) && !entry.startsWith('/') && !entry.includes('\\') && entry.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..') && !entry.includes(':');
}
async function save(items: InstalledExtra[]): Promise<void> {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const temporary = path.join(root(), 'installed.json.tmp');
  await Bun.write(temporary, JSON.stringify(items, null, 2), { mode: 0o600 });
  await rename(temporary, path.join(root(), 'installed.json'));
}
const defaults: ExtrasSettings = { enabled: false, allowedOrigins: ['https://extras.nationdex.com'], catalogue: [] };
async function settings(): Promise<ExtrasSettings> {
  const raw = await panelStore.getMeta(settingsKey);
  if (!raw) return defaults;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid remote extras settings');
  const input = value as Partial<ExtrasSettings>;
  if (typeof input.enabled !== 'boolean' || !Array.isArray(input.allowedOrigins) || input.allowedOrigins.length > 20 || !input.allowedOrigins.every(validOrigin) || new Set(input.allowedOrigins).size !== input.allowedOrigins.length || !Array.isArray(input.catalogue) || input.catalogue.length > 100 || !input.catalogue.every(item => item && validId(item.id) && validRepository(item.repository) && typeof item.ref === 'string' && commit.test(item.ref))) throw new Error('Invalid remote extras settings');
  if (new Set(input.catalogue.map(item => item.id)).size !== input.catalogue.length) throw new Error('Duplicate extra ids');
  return { enabled: input.enabled, allowedOrigins: input.allowedOrigins, catalogue: input.catalogue };
}
export async function extrasAllowedOrigins(): Promise<string[]> {
  try { return (await settings()).allowedOrigins; } catch { return defaults.allowedOrigins; }
}
async function git(args: string[], cwd: string): Promise<string> {
  const proc = Bun.spawn(['git', '-c', 'core.hooksPath=/dev/null', '-c', 'protocol.file.allow=never', '-c', 'protocol.ext.allow=never', ...args], {
    cwd, env: { PATH: process.env.PATH, HOME: process.env.HOME, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0' }, stdout: 'pipe', stderr: 'pipe',
  });
  const timeout = setTimeout(() => proc.kill(), 60_000);
  try {
    const [stdout, , exitCode] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    if (exitCode !== 0) throw new Error('Could not retrieve the approved extra commit');
    return stdout;
  } finally { clearTimeout(timeout); }
}
async function install(entry: CatalogueEntry): Promise<InstalledExtra> {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const dir = path.join(root(), entry.id + '-' + entry.ref);
  const stage = path.join(root(), '.stage-' + crypto.randomUUID());
  await mkdir(stage, { mode: 0o700 });
  try {
    await git(['init', '--quiet'], stage);
    await git(['fetch', '--quiet', '--depth=1', '--no-tags', '--no-recurse-submodules', 'https://github.com/' + entry.repository + '.git', entry.ref], stage);
    const hash = (await git(['rev-parse', 'FETCH_HEAD'], stage)).trim();
    if (hash !== entry.ref) throw new Error('Extra commit did not match the catalogue');
    const tree = await git(['ls-tree', '-r', 'FETCH_HEAD'], stage);
    if (tree.split('\n').some(line => line && !line.startsWith('100644 ') && !line.startsWith('100755 '))) throw new Error('Extras cannot contain symbolic links or submodules');
    await git(['checkout', '--quiet', '--detach', 'FETCH_HEAD'], stage);
    await rm(path.join(stage, '.git'), { recursive: true, force: true });
    const manifest = JSON.parse(await readFile(path.join(stage, 'nationdex.extra.json'), 'utf8')) as ExtraManifest;
    if (manifest.id !== entry.id || manifest.apiVersion !== 1 || !safeEntry(manifest.entrypoint)) throw new Error('Invalid extra manifest; expected apiVersion 1 and a relative JS/TS entrypoint');
    if (!(await lstat(path.join(stage, manifest.entrypoint))).isFile()) throw new Error('Missing extra entrypoint');
    // Never overwrite code already loaded by this process. Each approved commit has its own directory.
    try { await rename(stage, dir); } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code || '')) throw error;
    }
    return { ...entry, entrypoint: manifest.entrypoint, enabled: true };
  } finally { await rm(stage, { recursive: true, force: true }); }
}

/** Load enabled extras once at startup, before registering Discord commands. Restart applies installations/removals. */
export async function loadExtras(client: ForgeClient): Promise<void> {
  const items = await state();
  for (const extra of items) {
    if (!extra.enabled) {
      await rm(path.join(root(), extra.id + '-' + extra.ref), { recursive: true, force: true });
      continue;
    }
    const key = extra.id + '-' + extra.ref;
    if (loaded.has(key)) continue;
    const module = await import(pathToFileURL(path.join(root(), key, extra.entrypoint)).href);
    if (typeof module.register !== 'function') throw new Error('Extra ' + extra.id + ' must export register(client)');
    await module.register(client);
    loaded.add(key);
  }
  if (items.some(extra => !extra.enabled)) await save(items.filter(extra => extra.enabled));
}

export async function extrasOperation(operation: string, rawBody = ''): Promise<Record<string, unknown>> {
  let body: { id?: unknown; ref?: unknown } = {};
  if (operation !== 'list') {
    try { body = JSON.parse(rawBody) as typeof body; } catch { return { status: 400, error: 'Invalid JSON.' }; }
    if (!body || typeof body !== 'object' || !validId(body.id)) return { status: 400, error: 'Invalid extra id.' };
  }
  if (!['list', 'install', 'remove'].includes(operation)) return { status: 400, error: 'Unknown extras operation.' };
  let config: ExtrasSettings;
  try { config = await settings(); } catch { return { status: 503, error: 'Remote extras settings are unavailable.' }; }
  if (!config.enabled) return { status: 403, error: 'Remote extras are disabled by the host owner.' };
  if (operation === 'list') {
    try { return { status: 200, extras: await state(), restartRequired: true, apiVersion: 1 }; }
    catch { return { status: 500, error: 'Could not read installed extras.' }; }
  }
  if (mutating) return { status: 409, error: 'Another extras operation is in progress.' };
  mutating = true;
  try {
    const items = await state();
    if (operation === 'remove') {
      const extra = items.find(item => item.id === body.id);
      if (!extra) return { status: 404, error: 'Extra is not installed.' };
      // Deactivation is applied at restart; keep data outside this manager untouched.
      extra.enabled = false;
      await save(items);
      return { status: 200, restartRequired: true };
    }
    if (typeof body.ref !== 'string' || !commit.test(body.ref)) return { status: 400, error: 'Invalid commit hash.' };
    const approved = config.catalogue.find(item => item.id === body.id && item.ref === body.ref);
    if (!approved) return { status: 403, error: 'Extra and commit are not approved by the host catalogue.' };
    const extra = await install(approved);
    await save([...items.filter(item => item.id !== extra.id), extra]);
    return { status: 200, extra, restartRequired: true };
  } catch (error) {
    console.error('Extras operation failed:', error);
    return { status: 500, error: 'Extras operation failed; check the bot logs.' };
  } finally { mutating = false; }
}
