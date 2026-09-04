import { BaseCommand, ForgeClient } from '@tryforge/forgescript';
import { variables } from './variables';

export interface CommandConfig {
  name?: string;
  aliases?: string[];
  description?: string;
  usage?: string;
  type?: string;
  unprefixed?: boolean;
  hide?: boolean;
  allowedInteractionTypes?: string[];
  tags?: string[];
  [key: string]: any;
}

export const commands = {
  prefix: {
      howlate: {
      name: 'howlate',
      aliases: ['hl'],
      description: `Check how late someone was compared to the user who caught the last ${variables.keywords.collectible.singular} by replying to their message`,
      usage: '',
      type: 'messageCreate',
      tags: ['utility', 'spawn', 'collectibles', 'timing'],
    },
  },
  dev: {
    eval: {
      name: 'eval',
      aliases: ['ev'],
      description: 'Evaluate ForgeScript code (Developer only)',
      usage: '<code>',
      type: 'messageCreate',
      tags: ['dev', 'utility', 'admin'],
    },
  },

  ready: {
    type: 'clientReady',
    description: 'Fires when the app is ready',
  },
  spawn: {
    type: 'messageCreate',
    description: 'Spawns a random collectible in the channel',
    unprefixed: true,
  },
  catch: {
    type: 'messageCreate',
    description: 'Allows users to catch a spawned collectible',
    unprefixed: true,
  },
  
  autocomplete: {
    class: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['autocomplete'],
      description: 'Autocomplete for collectible classes',
    },
    collectibles: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['autocomplete'],
      description: 'Autocomplete for collectibles',
    },
    rarity: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['autocomplete'],
      description: 'Autocomplete for collectible rarities info',
    },
  },

  interaction: {
    pages: {
      type: 'interactionCreate',
      description: 'Pagination interactions',
    },
    settings: {
      type: 'interactionCreate',
      description: 'Settings page interactions',
    },
    collectibles: {
      gift: {
        type: 'interactionCreate',
        description: 'Collectibles gift command interaction',
      },
      info: {
        type: 'interactionCreate',
        description: 'Collectibles info command interaction',
      },
      sell: {
        type: 'interactionCreate',
        description: 'Collectibles sell command interaction',
      },
    },
  },

  init(client: ForgeClient, path = 'dist/commands') {
    client.commands.load(path);
  },
};

export function command(
  pathKey: string,
  codeOrOptions: string | { code?: string; [key: string]: any }
): BaseCommand<any> {
  const parts = pathKey.split('.');
  let cfg: any = commands;
  for (const part of parts) {
    if (cfg && typeof cfg === 'object' && part in cfg) {
      cfg = cfg[part];
    } else {
      cfg = undefined;
      break;
    }
  }

  if (!cfg) {
    cfg = (commands as any)[pathKey];
  }

  if (!cfg) {
    throw new Error(`[commands] Command configuration for '${pathKey}' not found in commands.ts.`);
  }

  const options = typeof codeOrOptions === 'string' ? { code: codeOrOptions } : codeOrOptions;

  return new BaseCommand({
    ...cfg,
    ...options,
    code: options.code ?? '',
  });
}
