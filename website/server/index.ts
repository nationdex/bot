import path from 'node:path';
import { authUser, handleAuth, hasPermission } from './auth';
import { ensureCatchIndex, handleData } from './data';
import { handlePanel } from './users';
import { proxyBot, proxyCardImage, useBotRunner, type BotRunner } from './proxy';
import { accepted, json } from './util';
import { getMeta, setMeta } from './db';

// The built UI sits next to the bot (cwd/website/dist), also when everything runs from one compiled binary.
const distDir = path.join(process.cwd(), 'website', 'dist');

// Best encoding the browser accepts, from the precompressed files the build wrote next to each asset.
const ENCODINGS = [
  ['br', 'br'],
  ['gzip', 'gz'],
] as const;

// Nothing here needs third parties, so say so: scripts, styles, fonts, images and requests only from this origin.
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
};

async function serveStatic(req: Request, pathname: string): Promise<Response> {
  const file = path.join(distDir, pathname);
  if (file !== distDir && !file.startsWith(distDir + path.sep)) return new Response(null, { status: 403 });

  let source = Bun.file(file);
  // SPA fallback: unknown paths get the app shell so client routes survive a reload.
  if (!(await source.exists()) || pathname.endsWith('/')) source = Bun.file(path.join(distDir, 'index.html'));

  const headers: Record<string, string> = { Vary: 'Accept-Encoding' };
  if (/(chunk|logo)-[a-z0-9]+\./.test(source.name ?? ''))
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  else if (pathname.startsWith('/fonts/'))
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'; // renamed if ever changed
  else if (pathname.startsWith('/icons/')) headers['Cache-Control'] = 'public, max-age=86400';
  else headers['Cache-Control'] = 'no-cache'; // the shell, manifest and service worker must always be revalidated
  if (pathname === '/manifest.webmanifest') headers['Content-Type'] = 'application/manifest+json';
  if (pathname === '/sw.js') headers['Service-Worker-Allowed'] = '/';
  headers['Content-Type'] ??= source.type;

  const wanted = accepted(req.headers.get('accept-encoding'));
  for (const [encoding, ext] of ENCODINGS) {
    const packed = Bun.file(`${source.name}.${ext}`);
    if (wanted.has(encoding) && (await packed.exists()))
      return new Response(packed, { headers: { ...headers, 'Content-Encoding': encoding } });
  }
  return new Response(source, { headers });
}

// Match both the HTTP method and the complete path before using the shared bot token.
const BOT_READ_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/stats$/, 'view_dashboard'],
  [/^\/collectibles(?:\/data)?$/, 'view_dashboard'],
  [/^\/config$/, 'manage_bot_settings'],
  [/^\/(?:user|users\/[^/]+\/auction|search_db\/(?:balance|auctionHouse))$/, 'manage_users'],
  [/^\/search_db\/collectible$/, 'manage_nations'],
  [/^\/(?:guilds\/[^/]+|search_db\/spawnConfig)$/, 'manage_servers'],
  [/^\/(?:cards(?:\/backgrounds)?|search_db\/specials)$/, 'manage_cards'],
];

const BOT_WRITE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/config(?:\/(?:add|delete|reset))?$/, 'manage_bot_settings'],
  [/^\/users\/[^/]+\/(?:balance|settings(?:\/reset)?|stats|auction|nations\/(?:give|remove|edit))$/, 'manage_users'],
  [/^\/nations(?:\/[^/]+(?:\/(?:delete|category))?)?$/, 'manage_nations'],
  [/^\/guilds\/[^/]+\/edit$/, 'manage_servers'],
  [
    /^\/(?:nations\/[^/]+\/(?:art|card)|cards\/(?:add\/(?:special|regime)|backgrounds(?:\/[^/]+\/(?:replace|delete))?|[^/]+\/edit)|categories(?:\/[^/]+\/delete)?)$/,
    'manage_cards',
  ],
];

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!pathname.startsWith('/api/')) {
    return req.method === 'GET' || req.method === 'HEAD'
      ? serveStatic(req, pathname)
      : new Response(null, { status: 405 });
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const site = req.headers.get('sec-fetch-site');
    const origin = req.headers.get('origin');
    // Reverse proxies already supply this header for HTTPS cookie handling; preserve their public scheme.
    const protocol =
      req.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https:'
        ? 'https:'
        : req.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https'
          ? 'https:'
          : url.protocol;
    if ((site && site !== 'same-origin' && site !== 'none') || (origin && origin !== protocol + '//' + url.host)) {
      return json({ error: 'Cross-origin panel mutations are forbidden.' }, 403);
    }
  }
  if (pathname.startsWith('/api/auth/')) return handleAuth(req, pathname);

  // Keep path segments stable between the permission check and upstream URL parsing.
  if (
    /%(?:2f|5c)/i.test(url.pathname) ||
    /[\\%\x00-\x1f\x7f]/.test(pathname) ||
    pathname.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    return new Response(null, { status: 400 });
  }

  const read = req.method === 'GET' || req.method === 'HEAD';
  if (read && /^\/api\/bot\/cards\/(?:image\/[^/]+|[^/]+\/image)$/.test(pathname)) {
    return proxyCardImage(pathname);
  }

  if (pathname.startsWith('/api/panel/') || pathname.startsWith('/api/bot/')) {
    const me = await authUser(req);
    if (!me) return json({ error: 'Unauthorized' }, 401);
    if (pathname.startsWith('/api/bot/')) {
      const rules = read ? BOT_READ_RULES : req.method === 'POST' ? BOT_WRITE_RULES : [];
      const permission = rules.find(([pattern]) => pattern.test(pathname.slice('/api/bot'.length)))?.[1];
      if (!permission || !hasPermission(me, permission)) return json({ error: 'Forbidden' }, 403);
      const data = await handleData(req, pathname, url.searchParams);
      return data ?? proxyBot(req, pathname, url.search, `panel:${me.id}`);
    }
    if (pathname.startsWith('/api/panel/data/')) {
      const permission =
        pathname === '/api/panel/data/instances'
          ? 'manage_nations'
          : pathname === '/api/panel/data/users'
            ? 'manage_users'
            : 'view_dashboard';
      if (!hasPermission(me, permission)) return json({ error: 'Forbidden' }, 403);
      const data = await handleData(req, pathname, url.searchParams);
      if (data) return data;
    }
    if (pathname === '/api/panel/extras/settings') {
      if (me.role !== 'owner') return json({ error: 'Only the panel owner can manage remote extras.' }, 403);
      const key = 'remote_extras_settings';
      if (req.method === 'GET') {
        let value: unknown = { enabled: false, allowedOrigins: ['https://extras.nationdex.com'], catalogue: [] };
        try {
          value = JSON.parse((await getMeta(key)) || JSON.stringify(value));
        } catch {
          return json({ error: 'Saved extras settings are invalid.' }, 500);
        }
        return json(value, 200, { 'Cache-Control': 'no-store' });
      }
      if (req.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405);
      const reader = req.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      let timedOut = false;
      const deadline = setTimeout(() => {
        timedOut = true;
        void reader?.cancel().catch(() => {});
      }, 10_000);
      try {
        if (reader)
          for (;;) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.byteLength;
            if (size > 32_768) {
              await reader.cancel();
              return json({ error: 'Settings request is too large.' }, 413);
            }
            chunks.push(part.value);
          }
      } catch {
        return json({ error: 'Could not read settings request.' }, timedOut ? 408 : 400);
      } finally {
        clearTimeout(deadline);
        reader?.releaseLock();
      }
      if (timedOut) return json({ error: 'Settings request timed out.' }, 408);
      let body: { enabled?: unknown; allowedOrigins?: unknown; catalogue?: unknown } | null;
      try {
        body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) as typeof body;
      } catch {
        body = null;
      }
      const originValid = (value: unknown): value is string => {
        if (typeof value !== 'string' || value.length > 255) return false;
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && url.origin === value && !url.username && !url.password;
        } catch {
          return false;
        }
      };
      const catalogueValid = (
        value: unknown,
      ): value is Array<{ id: string; repository: string; ref: string; path?: string }> =>
        Array.isArray(value) &&
        value.length <= 100 &&
        value.every(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            /^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id) &&
            typeof item.repository === 'string' &&
            item.repository.length <= 201 &&
            item.repository.split('/').length === 2 &&
            item.repository
              .split('/')
              .every((part: string) => /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,98}[A-Za-z0-9])?$/.test(part)) &&
            typeof item.ref === 'string' &&
            /^[a-f0-9]{40}$/.test(item.ref) &&
            (item.path === undefined ||
              (typeof item.path === 'string' &&
                item.path.length <= 200 &&
                (item.path === '' ||
                  item.path
                    .split('/')
                    .every(
                      (segment: string) =>
                        /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(segment) && segment.toLowerCase() !== '.git',
                    )))),
        );
      if (
        !body ||
        typeof body.enabled !== 'boolean' ||
        !Array.isArray(body.allowedOrigins) ||
        body.allowedOrigins.length > 20 ||
        !body.allowedOrigins.every(originValid) ||
        new Set(body.allowedOrigins).size !== body.allowedOrigins.length ||
        !catalogueValid(body.catalogue) ||
        new Set(body.catalogue.map((item) => item.id)).size !== body.catalogue.length
      )
        return json(
          { error: 'Invalid settings. Use HTTPS origins and catalogue entries pinned to full commit hashes.' },
          400,
        );
      const settings = { enabled: body.enabled, allowedOrigins: body.allowedOrigins, catalogue: body.catalogue };
      await setMeta(key, JSON.stringify(settings));
      return json({ ok: true, settings }, 200, { 'Cache-Control': 'no-store' });
    }
    return handlePanel(req, pathname, me);
  }
  return json({ status: 404, error: 'Not found' }, 404);
}

// Runs inside the bot's Bun process; the caller has already initialised the panel tables in the bot's PGlite.
export function startPanelServer(opts: {
  port: number;
  hostname: string;
  run: BotRunner;
  tls?: { cert: string; key: string };
}): void {
  useBotRunner(opts.run);
  ensureCatchIndex().catch((err) => console.error('Admin panel: could not build the catch index:', err));
  Bun.serve({
    port: opts.port,
    hostname: opts.hostname,
    ...(opts.tls ? { tls: { cert: Bun.file(opts.tls.cert), key: Bun.file(opts.tls.key) } } : {}),
    fetch: async (req) => {
      const started = performance.now();
      const res = await route(req).catch((err) => {
        console.error('Admin panel request failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      });
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.headers.set(name, value);
      if (new URL(req.url).pathname.startsWith('/api/'))
        res.headers.append('Server-Timing', `app;dur=${(performance.now() - started).toFixed(1)}`);
      return res;
    },
  });
}
