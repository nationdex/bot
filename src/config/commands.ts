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
    extrasinstall: { name: 'extrasinstall', description: 'Owner-only extras install', usage: '<id> <commit>', type: 'messageCreate', tags: ['dev', 'extras'] },
    extrasremove: { name: 'extrasremove', description: 'Owner-only extras remove', usage: '<id>', type: 'messageCreate', tags: ['dev', 'extras'] },
    extrasupdate: { name: 'extrasupdate', description: 'Owner-only extras update', usage: '<id> <commit>', type: 'messageCreate', tags: ['dev', 'extras'] },
    extrasedit: { name: 'extrasedit', description: 'Owner-only extras edit', usage: '<id> <commit>', type: 'messageCreate', tags: ['dev', 'extras'] },
    extraslist: { name: 'extraslist', description: 'Owner-only extras list', usage: '', type: 'messageCreate', tags: ['dev', 'extras'] },
    eval: {
      name: 'eval',
      aliases: ['ev'],
      description: 'Run code in the isolated eval worker (requires the eval.run capability)',
      usage: '<code>',
      type: 'messageCreate',
      tags: ['dev', 'utility', 'admin'],
    },
  },

  guildCreate: {
    type: 'guildCreate',
    description: 'Leaves a server the moment it is added when it is blacklisted',
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
    auction: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['autocomplete'],
      description: 'Autocomplete for auction commands',
    },
    access: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['autocomplete'],
      description: 'Autocomplete for role names and capabilities in /access',
    },
  },

  interaction: {
    pages: {
      type: 'interactionCreate',
      description: 'Pagination interactions',
    },
    auction: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['button', 'selectMenu', 'modal'],
      description: 'Auction browse menus, buttons and the custom bid modal',
    },
    settings: {
      type: 'interactionCreate',
      description: 'Settings page interactions',
    },
    blacklist: {
      type: 'interactionCreate',
      description: 'Blacklist panel menus and buttons',
    },
    suggestions: {
      type: 'interactionCreate',
      description: 'Community suggestions browse panel, edit and staff queue buttons, menus and modals',
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
};
