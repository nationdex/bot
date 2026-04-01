import { ForgeCanvas } from '@tryforge/forge.canvas';
import { ForgeDB } from '@tryforge/forge.db';
import { ForgeClient } from '@tryforge/forgescript';
import { config } from './config';
import { allCommands, packages } from './src/packages';

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

// Register all application (slash) commands from every package
client.applicationCommands.add(...allCommands);

// Log loaded packages for visibility at startup
for (const pkg of packages) {
  const names = pkg.commands.map((c) => c.data.name).join(', ');
  console.log(`[packages] Loaded "${pkg.name}" (${pkg.commands.length} command(s): ${names})`);
}

client
  .login(config.token)
  .then(() => {
    // Register slash commands globally after the client is ready
    return client.applicationCommands.registerGlobal();
  })
  .catch((err: Error) => {
    console.error('Failed to log in or register commands:', err.message);
    process.exit(1);
  });
