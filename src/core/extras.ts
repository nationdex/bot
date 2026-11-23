import { constants } from 'node:fs';
import { mkdir, open, rename, rm, lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ForgeClient } from '@tryforge/forgescript';
const panelStore = require('../../website/server/db') as { getMeta: (key: string) => Promise<string | null> };

// Extras execute trusted code with the bot's privileges. Installation requires explicit panel approval.
interface CatalogueEntry { id: string; repository: string; ref: string; path?: string }
interface ExtrasSettings { enabled: boolean; allowedOrigins: string[]; catalogue: CatalogueEntry[] }
interface InstalledExtra extends CatalogueEntry { entrypoint: string; enabled: boolean }
interface ExtraManifest { id: string; entrypoint: string; apiVersion: number }
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
const commit = /^[a-f0-9]{40}$/;
const repositoryPart = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,98}[A-Za-z0-9])?$/;
const validRepository = (value: unknown): value is string => typeof value === 'string' && value.length <= 201 && value.split('/').length === 2 && value.split('/').every(part => repositoryPart.test(part));
const validExtraPath = (value: unknown): value is string | undefined => value === undefined || (
  typeof value === 'string' && value.length <= 200 && (value === '' ||
  value.split('/').every(segment => /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(segment) && segment.toLowerCase() !== '.git'))
);
function directoryKey(entry: CatalogueEntry): string {
  const suffix = entry.path ? '-' + new Bun.CryptoHasher('sha256').update(entry.path).digest('hex') : '';
  return entry.id + '-' + entry.ref + suffix;
}
const validOrigin = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 255) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && url.origin === value && !url.username && !url.password; } catch { return false; }
};
const root = (): string => path.resolve('data/extras');
const settingsKey = 'remote_extras_settings';
let mutating = false;
const loaded = new Set<string>();

const maxFiles = 5000;
const maxTreeBytes = 50 * 1024 * 1024;
const maxGitBytes = 100 * 1024 * 1024;
const maxOutputBytes = 2 * 1024 * 1024;

async function checkedFile(file: string, maxBytes: number): Promise<string> {
  // O_NOFOLLOW makes the type/size checks apply to the same inode that is read.
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > maxBytes) throw new Error('Invalid or oversized extras file');
    return await handle.readFile('utf8');
  } finally { await handle.close(); }
}
async function checkedRoot(): Promise<void> {
  for (const dir of [path.resolve('data'), root()]) {
    const info = await lstat(dir);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Extras directories cannot be symbolic links');
  }
}
async function inspectDirectory(dir: string, byteLimit: number, entryLimit = maxFiles): Promise<void> {
  let entries = 0, bytes = 0;
  async function visit(current: string): Promise<void> {
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error('Extras cannot contain symbolic links');
    if (++entries > entryLimit) throw new Error('Extra contains too many files');
    if (info.isDirectory()) {
      for (const name of await readdir(current)) await visit(path.join(current, name));
    } else if (info.isFile()) {
      bytes += info.size;
      if (bytes > byteLimit) throw new Error('Extra exceeds the storage limit');
    } else throw new Error('Extras may contain only files and directories');
  }
  await visit(dir);
}
async function directoryDigest(dir: string): Promise<string> {
  const digest = new Bun.CryptoHasher('sha256');
  async function visit(current: string): Promise<void> {
    const info = await lstat(current);
    if (info.isDirectory()) {
      for (const name of (await readdir(current)).sort()) await visit(path.join(current, name));
    } else {
      digest.update(JSON.stringify(path.relative(dir, current)) + '\0' + info.size + '\0');
      digest.update(await Bun.file(current).arrayBuffer());
    }
  }
  await visit(dir);
  return digest.digest('hex');
}
async function checkedManifest(dir: string, id: string): Promise<ExtraManifest> {
  const manifest = JSON.parse(await checkedFile(path.join(dir, 'nationdex.extra.json'), 16_384)) as ExtraManifest;
  if (!manifest || manifest.id !== id || manifest.apiVersion !== 1 || !safeEntry(manifest.entrypoint)) throw new Error('Invalid extra manifest');
  if (!(await lstat(path.join(dir, manifest.entrypoint))).isFile()) throw new Error('Missing extra entrypoint');
  return manifest;
}

async function state(): Promise<InstalledExtra[]> {
  try {
    await checkedRoot();
    const value: unknown = JSON.parse(await checkedFile(path.join(root(), 'installed.json'), 262_144));
    if (!Array.isArray(value) || value.length > 100 || new Set(value.map(item => item?.id)).size !== value.length || !value.every(item => item && validId(item.id) && validRepository(item.repository) && commit.test(item.ref) && validExtraPath(item.path) && safeEntry(item.entrypoint) && typeof item.enabled === 'boolean')) throw new Error('Invalid extras state');
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
  await checkedRoot();
  const temporary = path.join(root(), '.state-' + crypto.randomUUID());
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
  if (typeof input.enabled !== 'boolean' || !Array.isArray(input.allowedOrigins) || input.allowedOrigins.length > 20 || !input.allowedOrigins.every(validOrigin) || new Set(input.allowedOrigins).size !== input.allowedOrigins.length || !Array.isArray(input.catalogue) || input.catalogue.length > 100 || !input.catalogue.every(item => item && validId(item.id) && validRepository(item.repository) && typeof item.ref === 'string' && commit.test(item.ref) && validExtraPath(item.path))) throw new Error('Invalid remote extras settings');
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
  const timeout = setTimeout(() => proc.kill('SIGKILL'), 60_000);
  async function output(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > maxOutputBytes) { proc.kill('SIGKILL'); throw new Error('Git output exceeds the limit'); } chunks.push(part.value); } }
    finally { reader.releaseLock(); }
    return new TextDecoder().decode(Buffer.concat(chunks));
  }
  try {
    const [stdout, , exitCode] = await Promise.all([output(proc.stdout), output(proc.stderr), proc.exited]);
    if (exitCode !== 0) throw new Error('Could not retrieve the approved extra commit');
    return stdout;
  } finally { clearTimeout(timeout); }
}
async function install(entry: CatalogueEntry): Promise<InstalledExtra> {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  await checkedRoot();
  const dir = path.join(root(), directoryKey(entry));
  const stage = path.join(root(), '.stage-' + crypto.randomUUID());
  await mkdir(stage, { mode: 0o700 });
  try {
    await git(['init', '--quiet'], stage);
    await git(['fetch', '--quiet', '--depth=1', '--no-tags', '--no-recurse-submodules', 'https://github.com/' + entry.repository + '.git', entry.ref], stage);
    // This bounds retained objects after fetch; OS disk quotas are still needed to bound transfer-time disk usage.
    await inspectDirectory(path.join(stage, '.git'), maxGitBytes, 20_000);
    const hash = (await git(['rev-parse', 'FETCH_HEAD'], stage)).trim();
    if (hash !== entry.ref) throw new Error('Extra commit did not match the catalogue');
    const tree = await git(['ls-tree', '-r', '-l', '-z', 'FETCH_HEAD'], stage);
    const entries = tree.split('\0').filter(Boolean);
    if (entries.length > maxFiles) throw new Error('Extra contains too many files');
    let extractedBytes = 0;
    for (const line of entries) {
      const match = /^(100644|100755) blob [a-f0-9]+ +([0-9]+)\t/.exec(line);
      if (!match) throw new Error('Extras cannot contain symbolic links or submodules');
      extractedBytes += Number(match[2]);
      if (extractedBytes > maxTreeBytes) throw new Error('Extra exceeds the extracted size limit');
    }
    await git(['checkout', '--quiet', '--detach', 'FETCH_HEAD'], stage);
    await rm(path.join(stage, '.git'), { recursive: true, force: true });
    await inspectDirectory(stage, maxTreeBytes);
    const selected = entry.path ? path.join(stage, entry.path) : stage;
    if (!(await lstat(selected)).isDirectory()) throw new Error('Extra path must select a directory');
    const manifest = await checkedManifest(selected, entry.id);
    try { await rename(selected, dir); } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code || '')) throw error;
      // Re-enabling the same pin is safe only when its complete contents still match the fetched commit.
      await inspectDirectory(dir, maxTreeBytes);
      await checkedManifest(dir, entry.id);
      if (await directoryDigest(dir) !== await directoryDigest(selected)) throw new Error('Existing extra contents differ from the approved commit');
    }
    return { ...entry, entrypoint: manifest.entrypoint, enabled: true };
  } finally { await rm(stage, { recursive: true, force: true }); }
}

/** Load enabled extras once at startup, before registering Discord commands. Restart applies installations/removals. */
export async function loadExtras(client: ForgeClient): Promise<void> {
  const items = await state();
  for (const extra of items) {
    if (!extra.enabled) {
      await rm(path.join(root(), directoryKey(extra)), { recursive: true, force: true });
      continue;
    }
    const key = directoryKey(extra);
    if (loaded.has(key)) continue;
    await checkedRoot();
    const dir = path.join(root(), key);
    await inspectDirectory(dir, maxTreeBytes);
    const manifest = await checkedManifest(dir, extra.id);
    if (manifest.entrypoint !== extra.entrypoint) throw new Error('Installed extra entrypoint does not match its manifest');
    const module = await import(pathToFileURL(path.join(dir, extra.entrypoint)).href);
    if (typeof module.register !== 'function') throw new Error('Extra ' + extra.id + ' must export register(client)');
    await module.register(client);
    loaded.add(key);
  }
  if (items.some(extra => !extra.enabled)) await save(items.filter(extra => extra.enabled));
}

export async function extrasOperation(operation: string, rawBody = '', source: 'remote' | 'owner-command' = 'remote'): Promise<Record<string, unknown>> {
  let body: { id?: unknown; ref?: unknown } = {};
  if (operation !== 'list') {
    try { body = JSON.parse(rawBody) as typeof body; } catch { return { status: 400, error: 'Invalid JSON.' }; }
    if (!body || typeof body !== 'object' || !validId(body.id)) return { status: 400, error: 'Invalid extra id.' };
  }
  if (!['list', 'install', 'remove'].includes(operation)) return { status: 400, error: 'Unknown extras operation.' };
  let config: ExtrasSettings;
  try { config = await settings(); } catch { return { status: 503, error: 'Remote extras settings are unavailable.' }; }
  if (!config.enabled && source === 'remote') return { status: 403, error: 'Remote extras are disabled by the host owner.' };
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
    if (items.length >= 100 && !items.some(item => item.id === approved.id)) return { status: 409, error: 'The installed extras limit has been reached.' };
    const extra = await install(approved);
    await save([...items.filter(item => item.id !== extra.id), extra]);
    return { status: 200, extra, restartRequired: true };
  } catch (error) {
    console.error('Extras operation failed:', error);
    return { status: 500, error: 'Extras operation failed; check the bot logs.' };
  } finally { mutating = false; }
}
