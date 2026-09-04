import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ChannelType,
  Collection,
  InteractionContextType,
} from 'discord.js';
import { ApplicationCommand, ForgeClient } from '@tryforge/forgescript';
import { variables } from './variables';

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

export interface SlashRootCommandConfig {
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

export const slashCommands = {
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
  ping: {
    name: 'ping',
    description: `Check bot's latency`,
    independent: true,
    tags: ['ping', 'utility', 'latency'],
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
  },

  init(client: ForgeClient, path = 'dist/slash') {
    const mgr = client.applicationCommands as any;
    const originalLoadOne = mgr.loadOne?.bind(mgr);

    if (originalLoadOne) {
      mgr.loadOne = function (reqPath: string) {
        try {
          return originalLoadOne(reqPath);
        } catch (err: any) {
          console.warn(`[WARN] [slashCommands] Failed to load command file '${reqPath}':`, err?.message ?? err);
          return null;
        }
      };
    }

    try {
      client.applicationCommands.load(path);
    } catch (err: any) {
      console.warn(`[WARN] [slashCommands] Error while loading slash commands from '${path}':`, err?.message ?? err);
    }

    const allCommands: ApplicationCommand[] = [];
    function extract(val: any) {
      if (!val) return;
      if (val instanceof ApplicationCommand) {
        allCommands.push(val);
      } else if (val instanceof Collection || val instanceof Map) {
        for (const item of val.values()) {
          extract(item);
        }
      }
    }
    extract((client.applicationCommands as any).commands);

    const newCommands = new Collection<string, any>();

    for (const cmd of allCommands) {
      const meta = (cmd as any)?.__meta;
      if (!meta || !meta.root) {
        if (cmd?.name) {
          newCommands.set(cmd.name, cmd);
        }
        continue;
      }

      const { parts, root, group, sub } = meta;

      if (parts.length === 1) {
        newCommands.set(root.name, cmd);
      } else if (parts.length === 2) {
        if (!sub) continue;
        let rootCol = newCommands.get(root.name);
        if (!(rootCol instanceof Collection)) {
          rootCol = new Collection();
          newCommands.set(root.name, rootCol);
        }
        rootCol.set(sub.name, cmd);
      } else if (parts.length === 3) {
        if (!group || !sub) continue;
        let rootCol = newCommands.get(root.name);
        if (!(rootCol instanceof Collection)) {
          rootCol = new Collection();
          newCommands.set(root.name, rootCol);
        }
        let groupCol = rootCol.get(group.name);
        if (!(groupCol instanceof Collection)) {
          groupCol = new Collection();
          rootCol.set(group.name, groupCol);
        }
        groupCol.set(sub.name, cmd);
      }
    }

    (client.applicationCommands as any).commands = newCommands;

    client.applicationCommands.toJSON = function (type: any) {
      const arr: any[] = [];

      for (const rootCfg of Object.values(slashCommands)) {
        if (typeof rootCfg === 'function') continue;
        const root = rootCfg as SlashRootCommandConfig;
        const loadedValue = (client.applicationCommands as any).commands.get(root.name);
        if (!loadedValue) continue;

        if (loadedValue instanceof ApplicationCommand) {
          if (!loadedValue.mustRegisterAs(type)) continue;
          arr.push({
            type: ApplicationCommandType.ChatInput,
            name: root.name,
            description: root.description,
            options: root.options ?? [],
            integration_types: root.integration_types,
            contexts: root.contexts,
            default_member_permissions: root.default_member_permissions,
          });
        } else if (loadedValue instanceof Collection) {
          const options: any[] = [];

          if (root.subcommandGroups) {
            for (const group of Object.values(root.subcommandGroups)) {
              const groupVal = loadedValue.get(group.name);
              const groupOptions: any[] = [];
              if (group.subcommands && groupVal instanceof Collection) {
                for (const sub of Object.values(group.subcommands)) {
                  const cmd = groupVal.get(sub.name);
                  if (cmd && cmd.mustRegisterAs(type)) {
                    groupOptions.push({
                      type: ApplicationCommandOptionType.Subcommand,
                      name: sub.name,
                      description: sub.description,
                      options: sub.options ?? [],
                    });
                  }
                }
              }
              if (groupOptions.length > 0) {
                options.push({
                  type: ApplicationCommandOptionType.SubcommandGroup,
                  name: group.name,
                  description: group.description,
                  options: groupOptions,
                });
              }
            }
          }

          if (root.subcommands) {
            for (const sub of Object.values(root.subcommands)) {
              const cmd = loadedValue.get(sub.name);
              if (cmd && cmd.mustRegisterAs(type)) {
                options.push({
                  type: ApplicationCommandOptionType.Subcommand,
                  name: sub.name,
                  description: sub.description,
                  options: sub.options ?? [],
                });
              }
            }
          }

          if (options.length > 0) {
            arr.push({
              type: ApplicationCommandType.ChatInput,
              name: root.name,
              description: root.description,
              options,
              integration_types: root.integration_types,
              contexts: root.contexts,
              default_member_permissions: root.default_member_permissions,
            });
          }
        }
      }

      return arr;
    };
  },
};

export function slashCommand(
  pathKey: string,
  codeOrOptions: string | { code?: string; [key: string]: any }
): ApplicationCommand {
  try {
    const parts = pathKey.split('.');
    const rootKey = parts[0];
    const root = (slashCommands as any)[rootKey];

    if (!root) {
      console.warn(`[WARN] [slashCommands] Root command '${rootKey}' not found in slash.ts. Skipping command '${pathKey}'.`);
      return null as any;
    }

    let data: any;
    const independent = root.independent ?? false;
    let sub: any = undefined;
    let group: any = undefined;

    if (parts.length === 1) {
      data = {
        type: ApplicationCommandType.ChatInput,
        name: root.name,
        description: root.description,
        options: root.options,
        integration_types: root.integration_types,
        contexts: root.contexts,
        default_member_permissions: root.default_member_permissions,
      };
    } else if (parts.length === 2) {
      const subKey = parts[1];
      sub = root.subcommands?.[subKey];
      if (!sub) {
        console.warn(`[WARN] [slashCommands] Subcommand '${subKey}' not found under '${rootKey}' in slash.ts. Skipping command '${pathKey}'.`);
        return null as any;
      }
      data = {
        type: ApplicationCommandType.ChatInput,
        name: sub.name,
        description: sub.description,
        options: sub.options,
        integration_types: sub.integration_types ?? root.integration_types,
        contexts: sub.contexts ?? root.contexts,
      };
    } else if (parts.length === 3) {
      const groupKey = parts[1];
      const subKey = parts[2];
      group = root.subcommandGroups?.[groupKey];
      sub = group?.subcommands?.[subKey];
      if (!sub) {
        console.warn(`[WARN] [slashCommands] Subcommand '${subKey}' in group '${groupKey}' not found under '${rootKey}' in slash.ts. Skipping command '${pathKey}'.`);
        return null as any;
      }
      data = {
        type: ApplicationCommandType.ChatInput,
        name: sub.name,
        description: sub.description,
        options: sub.options,
        integration_types: sub.integration_types ?? root.integration_types,
        contexts: sub.contexts ?? root.contexts,
      };
    } else {
      console.warn(`[WARN] [slashCommands] Invalid pathKey '${pathKey}' with ${parts.length} levels. Skipping command.`);
      return null as any;
    }

    const options = typeof codeOrOptions === 'string' ? { code: codeOrOptions } : codeOrOptions;

    const appCmd = new ApplicationCommand({
      ...options,
      data,
      independent,
      code: options.code ?? '',
    });

    (appCmd as any).__meta = {
      pathKey,
      parts,
      rootKey,
      root,
      groupKey: parts.length === 3 ? parts[1] : undefined,
      group,
      subKey: parts.length >= 2 ? parts[parts.length - 1] : undefined,
      sub,
    };

    return appCmd;
  } catch (err: any) {
    console.warn(`[WARN] [slashCommands] Error initializing command '${pathKey}':`, err?.message ?? err);
    return null as any;
  }
}
