import { createHash } from 'node:crypto';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Compiler, Interpreter, Logger, type ForgeClient } from '@tryforge/forgescript';

// Admin panel served by this same Bun process (Bun.serve + Bun.build). It lives in website/ and is imported
// at runtime, so tsc never compiles it into dist/. Its tables share the bot's PGlite connection.
const panelRoot = path.join(process.cwd(), 'website');
const builtIndex = path.join(panelRoot, 'dist', 'index.html');
const RETRY_MS = 30_000;

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

// Runs ForgeScript in this process as a user in the home guild, like a command that user typed.
function runAs(client: ForgeClient, userId: string, code: string): Promise<string> {
  const obj = { user: { id: userId }, guild: { id: process.env.HOME_GUILD_ID }, channel: { id: '0' } };
  return Interpreter.run({ client, command: null, obj, data: Compiler.compile(code), doNotSend: true, redirectErrorsToConsole: true } as never) as Promise<string>;
}

// The panel calls the bot's API on this machine. Instead of a hand-made token in a .env file, it mints its own
// for the application owner once and keeps it in the database. API_BEARER_TOKEN still overrides it.
export function botTokens(client: ForgeClient, meta: { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void> }) {
  let cached: string | null = process.env.API_BEARER_TOKEN || null;
  let retryAt = 0;

  const isValid = async (token: string): Promise<boolean> => {
    const hash = createHash('sha256').update(token).digest('hex');
    const user = (await runAs(client, client.user?.id ?? '0', `$jsonLoad[acc;$accessData]$env[acc;tokens;${hash};user]`)).trim();
    return user !== '' && user !== 'undefined';
  };

  const mint = async (): Promise<string | null> => {
    if (!process.env.HOME_GUILD_ID) return null;
    const owners: string[] = JSON.parse((await runAs(client, client.user?.id ?? '0', '$accessOwners')).trim() || '[]');
    if (owners.length === 0) {
      Logger.warn('Admin panel: no owner has claimed the bot yet (/access claim), so it cannot reach the API.');
      return null;
    }
    const reply = (await runAs(client, owners[0], '$accessToken')).trim();
    if (!reply.startsWith('ok:')) {
      Logger.warn(`Admin panel: could not create its API token (${reply || 'no answer'}). Free one of the owner's tokens or set API_BEARER_TOKEN.`);
      return null;
    }
    const token = reply.slice(3);
    await meta.set('bot_token', token);
    Logger.info('Admin panel: created its API token.');
    return token;
  };

  return {
    async get(): Promise<string | null> {
      if (cached) return cached;
      if (Date.now() < retryAt) return null;
      retryAt = Date.now() + RETRY_MS;
      const stored = await meta.get('bot_token');
      cached = stored && (await isValid(stored)) ? stored : await mint();
      return cached;
    },
    invalidate(): void {
      if (!process.env.API_BEARER_TOKEN) cached = null;
    },
  };
}

export async function startPanel(client: ForgeClient): Promise<void> {
  if (!existsSync(panelRoot)) {
    Logger.warn('Admin panel skipped: no website/ folder next to the bot.');
    return;
  }
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
  // Literal paths so `bun build --compile` bundles the panel server into the binary; only website/dist stays on disk.
  const store = require('../../website/server/db');
  await store.initPanelDb(botDb.pg);

  const port = parseInt(process.env.PANEL_PORT || '3000', 10);
  const hostname = process.env.PANEL_HOST || '0.0.0.0';
  const { startPanelServer } = require('../../website/server');
  // HTTPS lets browsers ask for Brotli and install the panel as an app away from localhost.
  const tls = process.env.PANEL_TLS_CERT && process.env.PANEL_TLS_KEY ? { cert: process.env.PANEL_TLS_CERT, key: process.env.PANEL_TLS_KEY } : undefined;
  startPanelServer({ port, hostname, tls, tokens: botTokens(client, { get: store.getMeta, set: store.setMeta }) });
  Logger.info(`Admin panel listening on ${tls ? 'https' : 'http'}://${hostname}:${port}`);
}
