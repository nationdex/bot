import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Compiler, Interpreter, Logger, type ForgeClient } from '@tryforge/forgescript';

// The panel shares this process and its PGlite connection with the bot.
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

// Runs ForgeScript in this process as a user in the home guild, like a command that user typed.
async function runAs(client: ForgeClient, userId: string, code: string): Promise<string> {
  const obj = { user: { id: userId }, guild: { id: process.env.HOME_GUILD_ID }, channel: { id: '0' } };
  const result = await Interpreter.run({ client, command: null, obj, data: Compiler.compile(code), doNotSend: true, redirectErrorsToConsole: true } as never);
  if (result === null || result === undefined) throw new Error('Bot operation failed');
  return String(result);
}

export async function startPanel(client: ForgeClient): Promise<void> {
  if (!existsSync(panelRoot)) {
    Logger.warn('Admin panel skipped: no website/ folder next to the bot.');
    return;
  }
  const envPath = path.join(panelRoot, '.env');
  if (existsSync(envPath)) process.loadEnvFile(envPath);

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
  startPanelServer({ port, hostname, tls, run: (code: string) => runAs(client, client.user?.id ?? '0', code) });
  Logger.info(`Admin panel listening on ${tls ? 'https' : 'http'}://${hostname}:${port}`);
}
