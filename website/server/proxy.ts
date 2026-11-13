import { json, readJson } from './util';

const TIMEOUT_MS = 5000;
const IMAGE_TIMEOUT_MS = 6000;

const baseUrl = (): string => (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
// The bot hands the panel an API token for its own process (see src/core/panel.ts); no manual token is needed.
export type TokenProvider = { get: () => Promise<string | null>; invalidate: () => void };
let tokens: TokenProvider = { get: async () => process.env.API_BEARER_TOKEN ?? null, invalidate: () => {} };
export const useTokenProvider = (provider: TokenProvider): void => {
  tokens = provider;
};

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await tokens.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// The panel UI calls /api/bot/*; only these few paths differ from the bot's own /v1 routes.
function upstreamPath(path: string): string {
  const rest = path.replace('/api/bot', '');
  if (rest === '/collectibles') return '/collectibles/data';
  if (rest.startsWith('/nation/cards/')) return `/nations/${rest.slice('/nation/cards/'.length)}/card`;
  if (rest.startsWith('/nation/')) return `/nations/${rest.slice('/nation/'.length)}`;
  return rest;
}

const notConfigured = (): Response => json({ error: 'API_BASE_URL is not configured' }, 502);

// Card images are fetched by <img> tags, so they skip the session check (same as before).
export async function proxyCardImage(path: string): Promise<Response> {
  if (!baseUrl()) return notConfigured();
  const raw = path.startsWith('/api/bot/cards/image/') ? path.slice('/api/bot/cards/image/'.length) : path.slice('/api/bot/cards/'.length, -'/image'.length);
  const id = decodeURIComponent(raw.trim()).replace(/\.(png|jpg|webp|svg)$/i, '');
  try {
    const res = await fetch(`${baseUrl()}/cards/${encodeURIComponent(id)}/image`, { headers: await authHeaders(), signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
    if (!res.ok) return json({ error: 'Card Not Found' }, res.status);
    return new Response(res.body, { headers: { 'Content-Type': res.headers.get('content-type') || 'image/png', 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return json({ error: 'Card Not Found' }, 404);
  }
}

export async function proxyBot(req: Request, path: string, search: string): Promise<Response> {
  if (!baseUrl()) return notConfigured();
  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const res = await fetch(`${baseUrl()}${upstreamPath(path)}${search}`, {
      method: req.method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: hasBody ? JSON.stringify(await readJson(req)) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status === 401) tokens.invalidate();
    const type = res.headers.get('content-type') || '';
    if (res.ok && (type.includes('image/') || type.includes('application/octet-stream'))) {
      return new Response(res.body, { status: res.status, headers: { 'Content-Type': type } });
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return json({ ok: false, status: res.status, statusText: res.statusText, error: res.statusText }, res.status);
    }
    // Some ForgeScript routes answer with a JSON string instead of an object.
    if (typeof data === 'string' && data.trim().startsWith('{')) {
      try {
        data = JSON.parse(data);
      } catch {}
    }
    return json(data, res.status);
  } catch (err) {
    return json({ ok: false, status: 502, error: err instanceof Error ? err.message : 'Upstream API error' }, 502);
  }
}
