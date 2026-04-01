import { ForgeCanvas } from '@tryforge/forge.canvas';
import { ForgeDB } from '@tryforge/forge.db';
import { ForgeClient } from '@tryforge/forgescript';
import { config } from './config/config.example';

if (!config.token) {
  console.error('Missing bot token in config. Please set config.token.');
  process.exit(1);
}

const client = new ForgeClient({
  intents: ['Guilds', 'GuildMessages', 'MessageContent'],
  events: ['messageCreate', 'clientReady'],
  prefixes: [config.prefix],
  extensions: [new ForgeDB(), new ForgeCanvas()],
});

client.login(config.token).catch((err: Error) => {
  console.error('Failed to log in:', err.message);
  process.exit(1);
});
