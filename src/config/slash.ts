import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
} from 'discord.js';
import { variables } from './variables';
import { auctionConfig } from './auction';
import { RegistrationType } from '@tryforge/forgescript';
import { accessCommand, apiCommand } from './access';
import { blacklistGroups } from './blacklist';
import { suggestionAdminCommand, suggestionsCommand } from './suggestions';

export interface SlashOptionConfig {
  type: ApplicationCommandOptionType;
  name: string;
  description: string;
  required?: boolean;
  choices?: { name: string; value: string | number }[];
  autocomplete?: boolean;
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  channel_types?: ChannelType[];
  [key: string]: any;
}

export interface SlashSubcommandConfig {
  name: string;
  description: string;
  tags?: string[];
  options?: SlashOptionConfig[];
  integration_types?: ApplicationIntegrationType[];
  contexts?: InteractionContextType[];
  [key: string]: any;
}

export interface SlashSubcommandGroupConfig {
  name: string;
  description: string;
  subcommands: Record<string, SlashSubcommandConfig>;
  [key: string]: any;
}

export interface SlashCommandConfig {
  name: string;
  description: string;
  tags?: string[];
  independent?: boolean;
  integration_types?: ApplicationIntegrationType[];
  contexts?: InteractionContextType[];
  default_member_permissions?: string | null;
  options?: SlashOptionConfig[];
  subcommands?: Record<string, SlashSubcommandConfig>;
  subcommandGroups?: Record<string, SlashSubcommandGroupConfig>;
  [key: string]: any;
}

export const slashes = {
  player: {
    name: 'player',
    description: 'View and customize player settings and profiles',
    tags: ['player', 'profile'],
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    subcommands: {
      settings: {
        name: 'settings',
        description: 'View or customize your player settings.',
        tags: ['settings', 'config', 'privacy'],
      },
    },
  },

  economy: {
    name: `${variables.keywords.currency.plural}`,
    description: `Manage and view ${variables.keywords.currency.plural}`,
    tags: ['economy', 'currency'],
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    subcommands: {
      balance: {
        name: 'balance',
        description: `View your or another player's ${variables.keywords.currency.plural} balance`,
        tags: ['balance', 'wallet', 'economy'],
        options: [
          {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'The user to view the balance of',
            required: false,
          },
        ],
      },
      give: {
        name: 'give',
        description: `Give your ${variables.keywords.currency.plural} to another user`,
        tags: ['transfer', 'pay', 'economy'],
        options: [
          {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: `The user to give your ${variables.keywords.currency.plural} to`,
            required: true,
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'amount',
            description: `The amount of ${variables.keywords.currency.plural} to give`,
            required: true,
          },
        ],
      },
    },
  },

  leaderboard: {
    name: 'leaderboard',
    description: 'Global and server leaderboards',
    tags: ['leaderboard', 'rankings'],
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    subcommands: {
      balance: {
        name: `${variables.keywords.currency.plural}`,
        description: `Show the leaderboard of ${variables.keywords.currency.plural}`,
        tags: ['leaderboard', 'economy', 'balance'],
      },
      collectibles: {
        name: `${variables.keywords.collectible.plural}`,
        description: `Show the leaderboard of ${variables.keywords.collectible.plural} caught`,
        tags: ['leaderboard', 'collectibles', 'collection'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'class',
            description: 'The rarity class to view the leaderboard of.',
            required: false,
            autocomplete: true,
          },
        ],
      },
      value: {
        name: 'value',
        description: `Show the leaderboard for total ${variables.keywords.collectible.plural} value`,
        tags: ['leaderboard', 'rarity', 'value'],
      },
    },
  },

  collectibles: {
    name: `${variables.keywords.collectible.plural}`,
    description: `Commands to view and manage your ${variables.keywords.collectible.plural}`,
    tags: ['collectibles', 'inventory'],
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    subcommands: {
      duplicates: {
        name: 'duplicates',
        description: `View your most duplicated ${variables.keywords.collectible.plural}`,
        tags: ['duplicates', 'inventory', 'collectibles'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'class',
            description: `The class whose ${variables.keywords.collectible.plural} to show`,
            required: false,
            autocomplete: true,
          },
        ],
      },
      gift: {
        name: 'gift',
        description: `Gift a ${variables.keywords.collectible.singular} to another user`,
        tags: ['gift', 'trade', 'collectibles'],
        options: [
          {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'The user you want to send a gift to',
            required: true,
          },
          {
            type: ApplicationCommandOptionType.String,
            name: `${variables.keywords.collectible.singular}`,
            description: `The ${variables.keywords.collectible.singular} you want to gift`,
            required: true,
            autocomplete: true,
          },
        ],
      },
      info: {
        name: 'info',
        description: `View the info card of one of your ${variables.keywords.collectible.plural}.`,
        tags: ['info', 'card', 'collectibles'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: `${variables.keywords.collectible.singular}`,
            description: `The ${variables.keywords.collectible.singular} whose info card to view.`,
            required: false,
            autocomplete: true,
          },
        ],
      },
      last: {
        name: 'last',
        description: `View info of the last ${variables.keywords.collectible.singular} caught.`,
        tags: ['recent', 'latest', 'collectibles'],
        options: [
          {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: `The user whose last ${variables.keywords.collectible.singular} to check.`,
            required: false,
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'class',
            description: `View info of the last ${variables.keywords.collectible.singular} caught of a specific rarity class.`,
            required: false,
            autocomplete: true,
          },
        ],
      },
      progress: {
        name: 'progress',
        description: `View your ${variables.keywords.collectible.singular} collection progress`,
        tags: ['completion', 'progress', 'dex'],
        options: [
          {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: `The user whose ${variables.keywords.collectible.plural} progress to view.`,
            required: false,
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'class',
            description: 'The rarity class to view.',
            required: false,
            autocomplete: true,
          },
        ],
      },
      sell: {
        name: 'sell',
        description: `Sell a ${variables.keywords.collectible.singular} for ${variables.keywords.currency.plural}`,
        tags: ['sell', 'economy', 'trade'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: `${variables.keywords.collectible.singular}`,
            description: `The ${variables.keywords.collectible.singular} to sell.`,
            required: true,
            autocomplete: true,
          },
        ],
      },
    },
  },

  rarity: {
    name: 'rarity',
    description: `Check rarity tiers and information for ${variables.keywords.collectible.plural}`,
    tags: ['rarity', 'info'],
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    subcommands: {
      collectibles: {
        name: `${variables.keywords.collectible.plural}`,
        description: `View the rarity list of ${variables.keywords.collectible.plural}.`,
        tags: ['rarity', 'list', 'collectibles'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'class',
            description: `The rarity class of the ${variables.keywords.collectible.plural} you want to view.`,
            required: false,
            autocomplete: true,
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'sort_type',
            description: 'Sort type of the list.',
            required: false,
            choices: [
              {
                name: 'Common to Rare',
                value: 'desc',
              },
              {
                name: 'Rare to Common',
                value: 'asc',
              },
            ],
          },
        ],
      },
      info: {
        name: 'info',
        description: `View the rarity info of a ${variables.keywords.collectible.singular}`,
        tags: ['rarity', 'stats', 'chances'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: `${variables.keywords.collectible.singular}`,
            description: `The ${variables.keywords.collectible.singular} whose rarity info to view.`,
            required: true,
            autocomplete: true,
          },
        ],
      },
    },
  },

  spawn: {
    name: 'spawn',
    description: `Configure ${variables.keywords.collectible.plural} spawning for this server`,
    tags: ['spawn', 'admin', 'server'],
    integration_types: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    subcommands: {
      channel: {
        name: 'channel',
        description: `Set the channel where ${variables.keywords.collectible.plural} will spawn.`,
        tags: ['admin', 'spawn', 'channel'],
        options: [
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'channel',
            description: `The channel to spawn ${variables.keywords.collectible.plural} in. Leave empty to reset.`,
            required: false,
            channel_types: [ChannelType.GuildText],
          },
        ],
      },
      configs: {
        name: 'configs',
        description: 'Check the spawn configuration of the server.',
        tags: ['admin', 'spawn', 'settings'],
      },
      toggle: {
        name: 'toggle',
        description: `Toggle ${variables.keywords.collectible.plural} spawning on or off in the server.`,
        tags: ['admin', 'spawn', 'toggle'],
      },
    },
  },

  about: {
    name: 'about',
    description: `About ${variables.config.bot.name}`,
    independent: true,
    tags: ['info', 'utility', 'bot'],
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
  },
  help: {
    name: 'help',
    description: 'Get a list of commands',
    independent: true,
    tags: ['help', 'utility', 'commands'],
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
  },
  utils: {
    name: 'utils',
    description: `Utility commands for ${variables.config.bot.name}`,
    tags: ['utils', 'utility'],
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
    subcommands: {
      ping: {
        name: 'ping',
        description: `Check bot's latency`,
        tags: ['ping', 'utility', 'latency'],
      },
      howlate: {
        name: 'howlate',
        description: `Check how late someone was compared to the user who caught the last ${variables.keywords.collectible.singular}`,
        tags: ['utility', 'spawn', 'timing'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'message',
            description: 'The message ID or link of the late guess to compare',
            required: false,
          },
        ],
      },
    },
  },
  auction: {
    name: 'auction',
    description: `Auction your ${variables.keywords.collectible.plural} for ${variables.keywords.currency.plural}`,
    tags: ['auction', 'economy', 'trade'],
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    subcommands: {
      create: {
        name: 'create',
        description: `List one of your ${variables.keywords.collectible.plural} in the auction house`,
        tags: ['auction', 'sell', 'list'],
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: `${variables.keywords.collectible.singular}`,
            description: `The ${variables.keywords.collectible.singular} to auction`,
            required: true,
            autocomplete: true,
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'starting_bid',
            description: `The minimum first bid in ${variables.keywords.currency.plural}`,
            required: true,
            min_value: 1,
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'duration',
            description: 'How long the auction runs',
            required: true,
            choices: auctionConfig.durations,
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'buyout',
            description: `Optional instant-win price in ${variables.keywords.currency.plural} (must exceed the starting bid)`,
            required: false,
            min_value: 2,
          },
        ],
      },
      browse: {
        name: 'browse',
        description: 'Browse, bid on and manage auctions in a private panel',
        tags: ['auction', 'browse', 'bid', 'list', 'cancel'],
      },
    },
  },

  admin: {
    name: 'admin',
    description: `Administrative and developer tools for ${variables.config.bot.name}`,
    tags: ['admin', 'developer'],
    // staff only: registered in the home server and gated by bot capabilities, never by Discord permissions
    type: RegistrationType.Guild,
    default_member_permissions: null,
    integration_types: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    subcommands: {
      suggestions: suggestionAdminCommand,
    },
    subcommandGroups: {
      ...blacklistGroups,
    },
  },

  suggestions: suggestionsCommand,

  access: accessCommand,
  api: apiCommand,
};
