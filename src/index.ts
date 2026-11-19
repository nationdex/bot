import './core/runtime/native';

import { get_forgescriptNative, get_forgescriptEvents, get_canvasFunctions, get_dbFunctions, get_dbEvents, get_apiFunctions, get_botFunctions, get_botCommands, get_botSlash } from './bundle-imports';
require('@tryforge/forgescript/dist/functions/recursiveReaddirSync').default = () => [];

import { ForgeCanvas } from '@tryforge/forge.canvas';
import { API } from '@nationdex/api';
import { DB } from '@nationdex/db';
import { ForgeClient, FunctionManager, EventManager } from '@tryforge/forgescript';
import {
  variables,
  collectibles,
  initCommands,
  initSlashCommands,
} from './core';
import { evalFunctions } from './core/runtime/evalRunner';
import { startPanel } from './core/panel';

const api = new API({
  path: 'src/api_routes',
  port: parseInt(process.env.API_PORT || '2222', 10),
});

const db = new DB({
  folder: process.env.DATABASE_FOLDER || './database',
});

const canvas = new ForgeCanvas();

const getReq = (arr: any[]) => arr.map(a => a.default ?? a).filter(Boolean);

// Register native and extension functions before initializing client
FunctionManager.addMany(getReq(get_forgescriptNative()));
FunctionManager.addMany(getReq(get_canvasFunctions()));
FunctionManager.addMany(getReq(get_dbFunctions()));
FunctionManager.addMany(getReq(get_apiFunctions()));
FunctionManager.addMany(evalFunctions);

const dex = new ForgeClient({
  intents: [
    'Guilds',
    'GuildMessages',
    'MessageContent',
  ],
  prefixes: ['<@$botID>', '$callFunction[jsonVar;config;prefix]'],
  extensions: [
    canvas,
    db,
  ],
});


// Register client events
EventManager.Loaded['native'] = {};
for (const req of getReq(get_forgescriptEvents())) {
  EventManager.Loaded['native'][req.name] = req;
}

dex.options.events = [
  'messageCreate',
  'interactionCreate',
  'clientReady',
  'guildCreate',
];
dex.events.load('native', dex.options.events);

// Register DB events
EventManager.Loaded['DBEvents'] = {};
for (const req of getReq(get_dbEvents())) {
  EventManager.Loaded['DBEvents'][req.name] = req;
}
if (db.options?.events?.length) {
  dex.events.load('DBEvents', db.options.events);
}

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

  // Load custom bot functions
  for (const fn of getReq(get_botFunctions())) {
    dex.functions.add(fn);
  }

  // Load commands (bundled)
  dex.commands.add(...getReq(get_botCommands()));
  initCommands({ path: '' }, dex);

  // Load slash commands (bundled)
  initSlashCommands({ path: '', commands: getReq(get_botSlash()) }, dex);

  api.init(dex);

  await dex.login(token);
  // The bot must keep running if the panel cannot start (for example in a compiled binary without website/).
  await startPanel(dex).catch((err) => console.error('Admin panel failed to start:', err));
}

main().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
