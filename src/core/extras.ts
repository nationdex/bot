import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ForgeClient } from '@tryforge/forgescript';

// Extras execute trusted code with the bot's privileges. Installation is an explicit host-owner opt-in.
interface CatalogueEntry { id: string; repository: string; ref: string }
interface InstalledExtra extends CatalogueEntry { entrypoint: string; enabled: boolean }
interface ExtraManifest { id: string; entrypoint: string; apiVersion: number }
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
const commit = /^[a-f0-9]{40}$/;
const repository = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/;
const root = (): string => path.resolve(process.env.EXTRAS_DIRECTORY || 'data/extras');
let mutating = false;
const loaded = new Set<string>();

async function state(): Promise<InstalledExtra[]> {
  try {
    const value: unknown = JSON.parse(await readFile(path.join(root(), 'installed.json'), 'utf8'));
    if (!Array.isArray(value) || !value.every(item => item && validId(item.id) && repository.test(item.repository) && commit.test(item.ref) && safeEntry(item.entrypoint) && typeof item.enabled === 'boolean')) throw new Error('Invalid extras state');
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
async function catalogue(): Promise<CatalogueEntry[]> {
  const file = process.env.EXTRAS_CATALOG_FILE;
  if (!file) throw new Error('EXTRAS_CATALOG_FILE is not configured');
  const value: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(value) || !value.every(item => item && validId(item.id) && typeof item.repository === 'string' && repository.test(item.repository) && typeof item.ref === 'string' && commit.test(item.ref))) throw new Error('Catalogue must contain ids, owner/repository names and full commit hashes');
  if (new Set(value.map(item => item.id)).size !== value.length) throw new Error('Duplicate extra ids');
  return value;
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

export function createExtrasHandler(_client: ForgeClient): (req: Request) => Promise<Response | null> {
  return async (req) => {
    const pathname = new URL(req.url).pathname;
    if (pathname !== '/v1/extras' && !pathname.startsWith('/v1/extras/')) return null;
    const origin = req.headers.get('origin');
    const allowed = (process.env.EXTRAS_ALLOWED_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean);
    const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    const reply = (value: unknown, status = 200) => Response.json(value, { status, headers });
    if (origin && !allowed.includes(origin)) return reply({ error: 'Origin is not approved' }, 403);
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    if (req.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
      return new Response(null, { status: 204, headers });
    }
    const token = process.env.EXTRAS_API_TOKEN;
    if (!token || token.length < 32) return reply({ error: 'Extras management is disabled; configure a dedicated token of at least 32 characters' }, 503);
    const supplied = req.headers.get('authorization') || '';
    const digest = (value: string) => createHash('sha256').update(value).digest();
    if (!timingSafeEqual(digest(supplied), digest('Bearer ' + token))) return reply({ error: 'Unauthorized' }, 401);
    if (pathname === '/v1/extras' && req.method === 'GET') {
      try { return reply({ extras: await state(), restartRequired: true, apiVersion: 1 }); }
      catch { return reply({ error: 'Could not read installed extras' }, 500); }
    }
    if (req.method !== 'POST' || !['/v1/extras/install', '/v1/extras/remove'].includes(pathname)) return reply({ error: 'Not found' }, 404);
    if (process.env.EXTRAS_ALLOW_INSTALL !== 'true') return reply({ error: 'Host owner has not enabled extras installation' }, 403);
    if (!(req.headers.get('content-type') || '').startsWith('application/json')) return reply({ error: 'Expected application/json' }, 415);
    let body: { id?: unknown; ref?: unknown };
    try {
      const reader = req.body?.getReader();
      const chunks: Uint8Array[] = []; let bytes = 0;
      if (reader) for (;;) { let timer: ReturnType<typeof setTimeout> | undefined; const part = await Promise.race([reader.read(), new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel(); reject(new Error('Body timeout')); }, 5000); })]).finally(() => clearTimeout(timer)); if (part.done) break; bytes += part.value.length; if (bytes > 4096) { await reader.cancel(); return reply({ error: 'Request too large' }, 413); } chunks.push(part.value); }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!body || typeof body !== 'object' || !validId(body.id)) return reply({ error: 'Invalid extra id' }, 400);
    } catch { return reply({ error: 'Invalid JSON' }, 400); }
    const perform = async (): Promise<Response> => {
      try {
        const items = await state();
        if (pathname.endsWith('/remove')) {
          const extra = items.find(item => item.id === body.id);
          if (!extra) return reply({ error: 'Extra is not installed' }, 404);
          // Do not delete code that this process may still be executing. User data is retained.
          extra.enabled = false;
          await save(items);
          return reply({ ok: true, restartRequired: true });
        }
        const approved = (await catalogue()).find(item => item.id === body.id && item.ref === body.ref);
        if (!approved) return reply({ error: 'Extra and commit are not approved by the host catalogue' }, 403);
        const extra = await install(approved);
        await save([...items.filter(item => item.id !== extra.id), extra]);
        return reply({ ok: true, extra, restartRequired: true });
      } catch (error) {
        console.error('Extras operation failed:', error);
        return reply({ error: 'Extras operation failed; check the bot logs' }, 500);
      }
    };
    if (mutating) return reply({ error: 'Another extras operation is in progress' }, 409);
    mutating = true;
    try { return await perform(); } finally { mutating = false; }
  };
}
