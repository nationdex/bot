import 'dotenv/config';
import { ForgeCanvas } from '@tryforge/forge.canvas';
import { Api } from '@nationdex/api';
import { ForgeDB } from '@nationdex/db';
import { ForgeClient } from '@tryforge/forgescript';
import { variables, syncVariables } from './config/variables';

const api = new Api({
  path: "dist/api_routes",
  port: 2222
});

const db = new ForgeDB({
  type: "surrealdb",
  engine: "rocksdb",
  folder: "./database",
  namespace: "forge",
  database: "forge.db",
});

const canvas = new ForgeCanvas();

const dex = new ForgeClient({
  intents: [
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
    api,
    canvas,
    db
  ],
});

const flushAndExit = async () => {
  try {
    const dataSource = (dex as any)?.db?.db;
    if (typeof dataSource?.close === "function") {
      await dataSource.close();
      console.log("database connection closed");
    }
  } catch {
    // ignore
  }
  process.exit(0);
};

process.on("SIGINT", flushAndExit);
process.on("SIGTERM", flushAndExit);

async function main() {
  db.variables(variables);
  await new Promise<void>((resolve) => {
    if ((dex as any).db?.driver?.db) {
      return resolve();
    }
    db.emitter.once('connect', () => {
      resolve();
    });
  });
  await syncVariables(dex);

  dex.functions.load('dist/functions');
  dex.commands.load('dist/commands');
  dex.applicationCommands.load('dist/slash');

  dex.login(process.env.TOKEN);
  api.init(dex);
}

main().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
