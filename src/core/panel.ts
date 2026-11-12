import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Logger, type ForgeClient } from '@tryforge/forgescript';

// Admin panel served by this same Bun process (Bun.serve + Bun.build). It lives in website/ and is imported
// at runtime, so tsc never compiles it into dist/. Its tables share the bot's PGlite connection.
const panelRoot = path.join(process.cwd(), 'website');
const builtIndex = path.join(panelRoot, 'dist', 'index.html');

function uiIsStale(): boolean {
  if (!existsSync(builtIndex)) return true;
  const builtAt = statSync(builtIndex).mtimeMs;
  for (const file of readdirSync(panelRoot, { recursive: true }) as string[]) {
    if (!/^(src|public)[\\/]|^index\.html$/.test(file)) continue;
    const full = path.join(panelRoot, file);
    if (statSync(full).isFile() && statSync(full).mtimeMs > builtAt) return true;
  }
  return false;
}

export async function startPanel(client: ForgeClient): Promise<void> {
  const envPath = path.join(panelRoot, '.env');
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  // The panel proxies bot API calls to the same process, so default to the local API unless configured.
  process.env.API_BASE_URL ||= `http://127.0.0.1:${process.env.API_PORT || '2222'}/v1`;

  if (uiIsStale()) {
    Logger.info('Building the admin panel UI...');
    await (await import(path.join(panelRoot, 'build'))).buildPanel();
  }

  // The DB extension is ready after login.
  const botDb = (client as any).db;
  await botDb.ready;

  const port = parseInt(process.env.PANEL_PORT || '3000', 10);
  const hostname = process.env.PANEL_HOST || '0.0.0.0';
  const { startPanelServer } = await import(path.join(panelRoot, 'server'));
  await startPanelServer({ pg: botDb.pg, port, hostname });
  Logger.info(`Admin panel listening on http://${hostname}:${port}`);
}
