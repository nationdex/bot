import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { Logger, type ForgeClient } from '@tryforge/forgescript';

// Admin panel served by the same Bun process as the bot. The panel server lives in website/server
// (storage: the bot's own PGlite connection, no second database) and is imported at runtime, so tsc never compiles it into dist/.
const panelRoot = path.join(process.cwd(), 'website');
const panelDist = path.join(panelRoot, 'dist');
const panelHandlers = path.join(panelRoot, 'server', 'handlers');

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveStatic(req: IncomingMessage, res: ServerResponse): void {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://panel').pathname);
  } catch {
    res.statusCode = 400;
    res.end();
    return;
  }

  let file = path.join(panelDist, pathname);
  if (file !== panelDist && !file.startsWith(panelDist + path.sep)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  // SPA fallback: unknown paths get the app shell so client routes survive a reload.
  if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(panelDist, 'index.html');

  res.setHeader('Content-Type', contentTypes[path.extname(file)] ?? 'application/octet-stream');
  if (pathname.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  createReadStream(file).pipe(res);
}

export async function startPanel(client: ForgeClient): Promise<void> {
  if (!existsSync(path.join(panelDist, 'index.html'))) {
    Logger.warn('Admin panel not built (website/dist missing). Run `bun run panel:build`. Panel skipped.');
    return;
  }

  const envPath = path.join(panelRoot, '.env');
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  // The panel proxies bot API calls to the same process, so default to the local API unless configured.
  process.env.API_BASE_URL ||= `http://127.0.0.1:${process.env.API_PORT || '2222'}/v1`;

  // Panel tables share the bot's PGlite (single writer, same process). The DB extension is ready after login.
  const botDb = (client as any).db;
  await botDb.ready;
  const { initPanelDb } = await import(path.join(panelRoot, 'server', 'db'));
  await initPanelDb(botDb.pg);

  const { handleAdminApi } = (await import(panelHandlers)) as {
    handleAdminApi: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
  };

  const server = createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/api/')) {
        if (await handleAdminApi(req, res)) return;
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 404, error: 'Not found' }));
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405;
        res.end();
        return;
      }
      serveStatic(req, res);
    } catch (err) {
      Logger.error('Admin panel request failed:', err);
      if (!res.headersSent) res.statusCode = 500;
      res.end();
    }
  });

  const port = parseInt(process.env.PANEL_PORT || '3000', 10);
  const host = process.env.PANEL_HOST || '0.0.0.0';
  server.on('error', (err) => Logger.error(`Admin panel failed to listen on ${host}:${port}:`, err));
  server.listen(port, host, () => Logger.info(`Admin panel listening on http://${host}:${port}`));
}
