import { ForgeCanvas } from '@tryforge/forge.canvas';
import { ForgeDB } from '@tryforge/forge.db';
import { ForgeClient, FunctionManager } from '@tryforge/forgescript';
import { ActivityType, Collection, type PresenceStatusData } from 'discord.js';
import { join } from 'path';
import { config } from './config';
import { customFunctions } from './src/functions';
import { logger } from './src/logger';
import { allCommands, packages } from './src/packages';

// ── Global error handlers ─────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(
    'Unhandled promise rejection',
    reason instanceof Error ? reason : new Error(String(reason))
  );
});

// ── Token guard ───────────────────────────────────────────────────────────────
if (!config.token) {
  logger.error('Missing bot token in config. Please set config.token.');
  process.exit(1);
}

// ── Client ────────────────────────────────────────────────────────────────────
const client = new ForgeClient({
  intents: ['Guilds', 'GuildMessages', 'MessageContent'],
  events: ['messageCreate', 'clientReady'],
  prefixes: [config.prefix],
  extensions: [
    new ForgeDB({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_HOST_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? process.env.POSTGRESPASSWORD ?? '',
      database: process.env.POSTGRES_DB ?? 'nationdex',
    }),
    new ForgeCanvas(),
  ],
});

// ── Register custom native functions ─────────────────────────────────────────
FunctionManager.addMany(customFunctions);

// ── Register commands ─────────────────────────────────────────────────────────
client.applicationCommands.add(...allCommands);

// Group nations commands into a subcommand collection keyed by collectibles name
const { collectibles, comp, list } = config.appearance.commands;
const mgr = client.applicationCommands as unknown as {
  path: string;
  commands: Collection<string, unknown>;
};

const nationsGroup = new Collection<string, unknown>();
const compCmd = mgr.commands.get(comp.name);
const listCmd = mgr.commands.get(list.name);
if (compCmd) {
  mgr.commands.delete(comp.name);
  nationsGroup.set(comp.name, compCmd);
}
if (listCmd) {
  mgr.commands.delete(list.name);
  nationsGroup.set(list.name, listCmd);
}
mgr.commands.set(collectibles, nationsGroup);

// Point at src/packages/ so toJSON() picks up nations/config.json for group description
mgr.path = join(process.cwd(), 'src/packages');

// ── Startup log ───────────────────────────────────────────────────────────────
for (const pkg of packages) {
  const names = pkg.commands.map((c: { data: { name: string } }) => c.data.name).join(', ');
  logger.info(
    `Loaded package "${pkg.name}" (${pkg.commands.length} command(s)${names ? `: ${names}` : ', grouped'})`
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
client
  .login(config.token)
  .then(() => {
    client.user?.setPresence({
      status: config.status as PresenceStatusData,
      activities: [
        {
          name: config.activity.name,
          type: ActivityType[config.activity.type as keyof typeof ActivityType],
        },
      ],
    });

    logger.info(`Ready on client ${client.user?.tag}`);
    return client.applicationCommands.registerGlobal();
  })
  .catch((err: Error) => {
    logger.error('Failed to log in or register commands', err);
    process.exit(1);
  });
