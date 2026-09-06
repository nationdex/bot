import 'dotenv/config';
import { ForgeCanvas } from '@tryforge/forge.canvas';
import { API } from '@nationdex/api';
import { DB } from '@nationdex/db';
import { ForgeClient } from '@tryforge/forgescript';
import {
  variables,
  commands,
  slashes,
  collectibles,
} from './util';

const api = new API({
  path: 'dist/api_routes',
  port: 2222,
});

const db = new DB({
  folder: './database',
});

const canvas = new ForgeCanvas();

const dex = new ForgeClient({
  intents: [
    'Guilds',
    'GuildMessages',
    'MessageContent',
  ],
  events: [
    'messageCreate',
    'interactionCreate',
    'clientReady',
  ],
  prefixes: ['<@$botID>', '$callFunction[jsonVar;config;prefix]'],
  extensions: [
    canvas,
    db,
  ],
});

const flushAndExit = async () => {
  try {
    const pg = (dex as any)?.db?.pg;
    if (typeof pg?.close === 'function') {
      await pg.close();
      console.log('database connection closed');
    }
  } catch {
    // ignore
  }
  process.exit(0);
};

process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

async function main() {
  const token = process.env.TOKEN;
  if (!token || token.trim() === '' || token === 'YOUR_DISCORD_APP_TOKEN') {
    throw new Error('Discord bot token is missing or not configured. Please set a valid TOKEN in your .env file.');
  }

  await variables.init(dex, db);
  await collectibles.init(dex);

  dex.functions.load('dist/functions');
  commands.init(dex);
  slashes.init(dex);
  api.init(dex);

  await dex.login(token);
}

main().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
