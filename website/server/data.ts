import { brotliCompressSync, constants } from 'node:zlib';
import { backfillCatchIndex, db } from './db';
import { accepted, json } from './util';

// Reads for the panel straight from the bot's PGlite (same process): no HTTP hop, no ForgeScript, no full-table
// dumps. Answers are computed once per TTL, compressed once, and revalidated with ETag.
const TTL_MS = 30_000;

type Bytes = Uint8Array<ArrayBuffer>;
type Entry = { at: number; ttl: number; body: string; etag: string; gz: Bytes | null; br: Bytes | null };
// Answers above this size (the raw table dumps nothing in the panel asks for anymore) are sent as they are and never kept.
const MAX_CACHED_BYTES = 2_000_000;
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<Entry>>();

// PGlite runs inside this process, so a panel query is time the bot does not get. Panel queries run one at a time and
// then rest for twice as long as they took (quick ones under 25 ms skip it), which caps the panel at about a third of
// the database's time no matter how hard it is hit.
let gate: Promise<unknown> = Promise.resolve();
const rest = (took: number): Promise<void> => (took < 25 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, Math.min(500, took * 2))));
function exclusive<T>(job: () => Promise<T>): Promise<T> {
  let took = 0;
  const run = gate.then(async () => {
    const started = performance.now();
    try {
      return await job();
    } finally {
      took = performance.now() - started;
    }
  });
  gate = run.then(() => rest(took), () => rest(took));
  return run;
}

// Per-session token bucket: a browser tab never needs more than a handful of data requests a second.
const buckets = new Map<string, { tokens: number; at: number }>();
const BURST = 20;
const REFILL_PER_SEC = 8;
function allow(req: Request): boolean {
  const key = (req.headers.get('cookie') ?? '').slice(0, 200);
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: BURST, at: now };
  b.tokens = Math.min(BURST, b.tokens + ((now - b.at) / 1000) * REFILL_PER_SEC);
  b.at = now;
  const ok = b.tokens >= 1;
  if (ok) b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 500) for (const [k, v] of buckets) if (now - v.at > 60_000) buckets.delete(k);
  return ok;
}

// Panel writes (and the bot's own edits through it) change what these answers say.
export function invalidateData(): void {
  cache.clear();
}

async function entry(key: string, ttl: number, compute: () => Promise<unknown>, gated: boolean): Promise<Entry> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return hit;
  let job = pending.get(key);
  if (!job) {
    job = (gated ? exclusive(compute) : compute())
      .then((data) => {
        const body = JSON.stringify(data);
        const bytes = new TextEncoder().encode(body);
        const small = bytes.length <= MAX_CACHED_BYTES;
        const made: Entry = {
          at: Date.now(),
          ttl,
          body,
          etag: `"${Bun.hash(body).toString(36)}"`,
          gz: small ? (Bun.gzipSync(bytes, { level: 6 }) as Bytes) : null,
          br: small ? (new Uint8Array(brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })) as Bytes) : null,
        };
        if (small) cache.set(key, made);
        return made;
      })
      .finally(() => pending.delete(key));
    pending.set(key, job);
  }
  return job;
}

// gated=false is for upstream HTTP reads, which cost the panel no database time of its own.
export async function cachedAnswer(req: Request, key: string, ttl: number, compute: () => Promise<unknown>, gated = true): Promise<Response> {
  const started = performance.now();
  const hit = cache.has(key);
  const made = await entry(key, ttl, compute, gated);
  const timing = `${hit ? 'cache;desc=hit' : `db;desc=miss;dur=${(performance.now() - started).toFixed(1)}`}`;
  const headers: Record<string, string> = { ETag: made.etag, 'Cache-Control': 'private, no-cache', Vary: 'Accept-Encoding', 'Content-Type': 'application/json', 'Server-Timing': timing };
  if (req.headers.get('if-none-match') === made.etag) return new Response(null, { status: 304, headers });
  const wanted = accepted(req.headers.get('accept-encoding'));
  if (wanted.has('br') && made.br) return new Response(made.br, { headers: { ...headers, 'Content-Encoding': 'br' } });
  if (wanted.has('gzip') && made.gz) return new Response(made.gz, { headers: { ...headers, 'Content-Encoding': 'gzip' } });
  return new Response(made.body, { headers });
}

const parse = (text: unknown): Record<string, any> => {
  try {
    const v = JSON.parse(String(text));
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};

async function catalog(): Promise<Record<string, { name?: string; class?: string; global_caught?: number }>> {
  const res = await db.query("SELECT value FROM record WHERE name = 'collectiblesData' LIMIT 1");
  return parse(res.rows[0]?.value).collectibles ?? {};
}

// Same four numbers as GET /v1/stats, counted in SQL instead of by loading every row.
async function stats(): Promise<unknown> {
  const res = await db.query(`
    SELECT (SELECT COUNT(*) FROM record WHERE name = 'userCollectibles') AS users,
           (SELECT COUNT(*) FROM record WHERE name = 'spawnConfig') AS guilds,
           (SELECT value FROM record WHERE name = 'collectiblesData' LIMIT 1) AS cat`);
  const row = res.rows[0];
  const cat = parse(row.cat);
  return {
    collectibles_caught_global: Number(cat.total_caught ?? 0),
    collectibles_count: Number(cat.total ?? 0),
    registered_users: Number(row.users),
    registered_guilds: Number(row.guilds),
  };
}

// One slim row per player (id, totals, privacy, gifts) instead of every inventory: ~100x smaller than the raw table.
async function users(): Promise<unknown[]> {
  const res = await db.query(`
    SELECT u.id, u.value, s.value AS settings
    FROM record u
    LEFT JOIN record s ON s.name = 'settings' AND s.type = 'user' AND s.id = u.id
    WHERE u.name = 'userCollectibles' AND u.type = 'user'`);
  const list: unknown[] = [];
  for (const row of res.rows) {
    const id = String(row.id ?? '').trim();
    if (!/^\d{15,22}$/.test(id)) continue;
    const val = parse(row.value);
    const set = row.settings ? parse(row.settings) : null;
    const unique = Array.isArray(val.unique) ? val.unique.length : Number(val.unique_count ?? val.unique ?? 0) || 0;
    const privacy = set ? String(set.inventory_privacy || set.privacy || 'public') : String(val.inventory_privacy || 'public');
    const gifts = set ? ![false, 'false', 0].includes(set.accept_gifts) : ![false, 'false'].includes(val.accept_gifts);
    list.push({
      discordId: id,
      username: String(val.username || val.global_name || val.name || ''),
      total: Number(val.total ?? 0),
      unique,
      totalValue: Number(val.total_value ?? val.totalValue ?? 0),
      inventoryPrivacy: privacy,
      acceptGifts: gifts,
    });
  }
  return list;
}

// Builds panel_catch (see db.ts) once; the catch queries wait for it.
let catchIndex: Promise<void> | null = null;
export function ensureCatchIndex(): Promise<void> {
  catchIndex ??= backfillCatchIndex().catch((err) => {
    catchIndex = null;
    throw err;
  });
  return catchIndex;
}

// Catches per bucket for the dashboard chart. Catches without a readable time count in the newest bucket, as before.
async function growth(t: number[]): Promise<unknown> {
  await ensureCatchIndex();
  const res = await db.query(
    `SELECT COUNT(*) FILTER (WHERE ts >= $1 AND ts < $2) AS c0,
            COUNT(*) FILTER (WHERE ts >= $2 AND ts < $3) AS c1,
            COUNT(*) FILTER (WHERE (ts >= $3 AND ts < $4) OR ts IS NULL) AS c2
     FROM panel_catch`,
    t
  );
  const r = res.rows[0];
  return { counts: [Number(r.c0), Number(r.c1), Number(r.c2)] };
}

const like = (q: string): string => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

// One page of catches (newest first) with the same search and class filters the page had client-side.
async function instances(q: string, rarity: string, limit: number, offset: number): Promise<unknown> {
  await ensureCatchIndex();
  const cat = await catalog();
  const needle = q.toLowerCase();
  const nationIds = needle ? Object.entries(cat).filter(([id, c]) => id.toLowerCase() === needle || String(c.name ?? '').toLowerCase().includes(needle)).map(([id]) => id) : [];
  const classIds = rarity && rarity !== 'all' ? Object.entries(cat).filter(([, c]) => String(c.class ?? '').toLowerCase() === rarity.toLowerCase()).map(([id]) => id) : null;

  const where: string[] = [];
  const params: unknown[] = [];
  const add = (v: unknown): string => {
    params.push(v);
    return `$${params.length}`;
  };
  if (needle) {
    const p = add(like(needle));
    // identifier is "old_collectible_<id>", so matching the id covers it; stat text is only searched when asked for.
    const stats = /atk|hp/.test(needle) ? ` OR concat('ATK:', p.atk, ' HP:', p.hp) ILIKE ${p}` : '';
    where.push(`(p.id ILIKE ${p} OR p.author ILIKE ${p}${stats} OR p.nation = ANY(${add(nationIds)}::text[]))`);
  }
  if (classIds) where.push(`p.nation = ANY(${add(classIds)}::text[])`);
  const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const count = await db.query(`SELECT COUNT(*) AS n FROM panel_catch p ${filter}`, params);
  const page = await db.query(
    `SELECT r.identifier, r.name, r.id, r.type, r.value
     FROM (SELECT p.identifier, p.ts, p.id FROM panel_catch p ${filter} ORDER BY p.ts DESC NULLS LAST, p.id LIMIT ${add(limit)} OFFSET ${add(offset)}) k
     JOIN record r ON r.identifier = k.identifier
     ORDER BY k.ts DESC NULLS LAST, k.id`,
    params
  );
  return { total: Number(count.rows[0].n), results: page.rows };
}

const int = (v: string | null, fallback: number, min: number, max: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
};

export async function handleData(req: Request, path: string, search: URLSearchParams): Promise<Response | null> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if ((path.startsWith('/api/panel/data/') || path === '/api/bot/stats') && !allow(req)) return json({ error: 'Too many requests, slow down.' }, 429, { 'Retry-After': '1' });
  if (path === '/api/bot/stats') return cachedAnswer(req, 'stats', TTL_MS, stats);
  if (path === '/api/panel/data/users') return cachedAnswer(req, 'users', TTL_MS, users);
  if (path === '/api/panel/data/growth') {
    const t = ['t0', 't1', 't2', 't3'].map((k) => Number(search.get(k)));
    if (t.some((n) => !Number.isFinite(n))) return json({ error: 't0..t3 are required' }, 400);
    return cachedAnswer(req, `growth:${t.join(',')}`, TTL_MS, () => growth(t));
  }
  if (path === '/api/panel/data/instances') {
    const q = (search.get('q') ?? '').trim().slice(0, 100);
    const rarity = (search.get('class') ?? 'all').trim().slice(0, 20);
    const limit = int(search.get('limit'), 10, 1, 200);
    const offset = int(search.get('offset'), 0, 0, 200_000);
    return cachedAnswer(req, `instances:${q}|${rarity}|${limit}|${offset}`, 15_000, () => instances(q, rarity, limit, offset));
  }
  return null;
}
