import path from 'node:path';
import { distDir } from '../build';
import { authUser, handleAuth } from './auth';
import { initPanelDb } from './db';
import { handlePanel } from './users';
import { proxyBot, proxyCardImage } from './proxy';
import { json } from './util';

type Pg = Parameters<typeof initPanelDb>[0];

async function serveStatic(pathname: string): Promise<Response> {
  const file = path.join(distDir, pathname);
  if (file !== distDir && !file.startsWith(distDir + path.sep)) return new Response(null, { status: 403 });

  let asset = Bun.file(file);
  // SPA fallback: unknown paths get the app shell so client routes survive a reload.
  if (!(await asset.exists()) || pathname.endsWith('/')) asset = Bun.file(path.join(distDir, 'index.html'));

  const hashed = /(chunk|logo)-[a-z0-9]+\./.test(asset.name ?? '');
  return new Response(asset, { headers: hashed ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {} });
}

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!pathname.startsWith('/api/')) {
    return req.method === 'GET' || req.method === 'HEAD' ? serveStatic(pathname) : new Response(null, { status: 405 });
  }
  if (pathname.startsWith('/api/auth')) return handleAuth(req, pathname);
  if (pathname.startsWith('/api/bot/cards/') && (pathname.endsWith('/image') || pathname.startsWith('/api/bot/cards/image/'))) {
    return proxyCardImage(pathname);
  }

  if (pathname.startsWith('/api/panel') || pathname.startsWith('/api/bot')) {
    const me = await authUser(req);
    if (!me) return json({ error: 'Unauthorized' }, 401);
    return pathname.startsWith('/api/panel') ? handlePanel(req, pathname, me) : proxyBot(req, pathname, url.search);
  }
  return json({ status: 404, error: 'Not found' }, 404);
}

// Runs inside the bot's Bun process; panel tables live in the bot's own PGlite connection.
export async function startPanelServer(opts: { pg: Pg; port: number; hostname: string }): Promise<void> {
  await initPanelDb(opts.pg);
  Bun.serve({
    port: opts.port,
    hostname: opts.hostname,
    fetch: (req) => route(req).catch((err) => {
      console.error('Admin panel request failed:', err);
      return json({ error: 'Internal Server Error' }, 500);
    }),
  });
}
