import { join } from 'node:path';
import { ForgeCanvas } from '@tryforge/forge.canvas';
import { ForgeDB } from '@tryforge/forge.db';
import { ForgeClient, FunctionManager } from '@tryforge/forgescript';
import { ActivityType, Collection, type PresenceStatusData } from 'discord.js';
import { sql } from 'drizzle-orm';
import { config } from '../config/config';
import { db } from './db';
import { DB_CONFIG } from './db/connection';
import { customFunctions } from './functions';
import { logger } from './logger';
import { allCommands, packages } from './packages';

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

// ── DB password guard ─────────────────────────────────────────────────────────
// pg's SASL/SCRAM auth throws a cryptic "client password must be a string" error
// when it receives an empty string. Catch it early with a clear message.
if (!DB_CONFIG.password) {
  logger.error(
    'Missing database password. Set the POSTGRES_PASSWORD environment variable before starting the bot.'
  );
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
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      username: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database,
    }),
    new ForgeCanvas(),
  ],
});

// ── Register custom native functions ─────────────────────────────────────────
FunctionManager.addMany(customFunctions);

// ── Register commands ─────────────────────────────────────────────────────────
client.applicationCommands.add(...allCommands);

// Group the nations subcommands under a single parent slash command.
//
// ForgeScript's ApplicationCommandManager stores commands in an internal
// Collection<string, Command | Collection<string, Command>>. When a value is
// itself a Collection, the framework treats it as a subcommand group and
// registers it as one Discord command with subcommands. This is the same
// structure the folder-based loader produces; we replicate it manually because
// this project uses the package-based loader instead.
//
// Tested against @tryforge/forgescript@2.6.0.
groupNationsSubcommands(client.applicationCommands);

/**
 * Moves the prog command out of the flat command registry and nests it under a
 * subcommand group named after `config.appearance.commands.collectibles`.
 * Also sets the manager's path so toJSON() can find nations/config.json for
 * the group description.
 */
function groupNationsSubcommands(appCmds: ForgeClient['applicationCommands']): void {
  const { collectibles, prog } = config.appearance.commands;

  // Access ForgeScript's internal command registry.
  const mgr = appCmds as unknown as {
    path: string;
    commands: Collection<string, unknown>;
  };

  const group = new Collection<string, unknown>();

  const progCmd = mgr.commands.get(prog.name);
  if (progCmd) {
    mgr.commands.delete(prog.name);
    group.set(prog.name, progCmd);
  }

  mgr.commands.set(collectibles, group);

  // Point at src/packages/ so toJSON() picks up nations/config.json for the
  // subcommand group description.
  mgr.path = join(process.cwd(), 'src/packages');
}

// ── Startup log ───────────────────────────────────────────────────────────────
for (const pkg of packages) {
  const names = pkg.commands.map((c: { data: { name: string } }) => c.data.name).join(', ');
  logger.info(
    `Loaded package "${pkg.name}" (${pkg.commands.length} command(s)${names ? `: ${names}` : ', grouped'})`
  );
}

// ── DB readiness probe ────────────────────────────────────────────────────────
// Runs once at startup. Does not block login — just surfaces a clear log entry
// when PostgreSQL is unreachable so the team knows why DB-dependent commands fail.
db.execute(sql`SELECT 1`)
  .then(() => logger.info('Database connection verified'))
  .catch((err: Error) =>
    logger.warn(
      'PostgreSQL is not reachable — commands that read/write user data will fail until the database is available. ' +
        'Check that the DB container is running before starting the bot.',
      err
    )
  );

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
