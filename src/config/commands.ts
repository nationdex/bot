
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
  prefix: {},
  dev: {},

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
};
