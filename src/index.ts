import { ForgeCanvas } from '@tryforge/forge.canvas';
import { ForgeDB } from '@tryforge/forge.db';
import { ForgeClient } from '@tryforge/forgescript';
import { config } from './config/config';
import { extras } from './config/extra';
import { installExtras, loadExtras, loadExtraVariables } from './extras';

const db = new ForgeDB({
  type: 'better-sqlite3',
});

const canvas = new ForgeCanvas();

const client = new ForgeClient({
  intents: [
    'Guilds',
    'GuildMessages',
    'GuildMembers',
    'MessageContent',
    'DirectMessages',
    'DirectMessageReactions',
  ],
  events: ['messageCreate', 'interactionCreate', 'clientReady'],
  prefixes: config.prefixes,
  extensions: [db, canvas],
});

installExtras(extras);
loadExtraVariables(db, extras, require('../src/config/variables.json'));
client.functions.load('dist/functions');
client.commands.load('dist/commands');
loadExtras(client, extras);
client.applicationCommands.load('dist/slash');

client.login(config.token);
