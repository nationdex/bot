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
    auction: {
      type: 'interactionCreate',
      allowedInteractionTypes: ['autocomplete'],
      description: 'Autocomplete for auction commands',
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
