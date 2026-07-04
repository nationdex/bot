import { ForgeCanvas } from '@tryforge/forge.canvas';
import { ForgeDB } from '@tryforge/forge.db';
import { ForgeClient } from '@tryforge/forgescript';
import { config } from './config/config';

const db = new ForgeDB({
  type: 'better-sqlite3',
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
  prefixes: config.prefixes,
  extensions: [
    db,
    canvas
  ],
});

db.variables(require('../src/config/variables.json'));
dex.functions.load('dist/functions');
dex.commands.load('dist/commands');
dex.applicationCommands.load('dist/slash');

dex.login(config.token);
