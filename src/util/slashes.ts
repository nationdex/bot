import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Collection,
} from 'discord.js';
import { ApplicationCommand, ForgeClient, ForgeExtension } from '@tryforge/forgescript';
import { slashes as slashesConfig, SlashCommandConfig } from '../config/slash';
import { withBlacklistGuard } from './blacklistGuard';

export interface SlashesOptions {
  path?: string;
  commands?: any[];
}

let client: ForgeClient | null = null;
let path = 'dist/slash';

function registerSlashCommand(targetCollection: Collection<string, any>, cmd: any) {
  if (!cmd) return;
  if (Array.isArray(cmd)) {
    for (const c of cmd) registerSlashCommand(targetCollection, c);
    return;
  }
  const resolved = cmd instanceof ApplicationCommand ? cmd : (cmd.default ?? cmd);
  if (!resolved) return;

  const meta = (resolved as any)?.__meta;
  if (!meta || !meta.root) {
    if (resolved?.name) {
      targetCollection.set(resolved.name, resolved);
    }
    return;
  }

  const { parts, root, group, sub } = meta;

  if (parts.length === 1) {
    targetCollection.set(root.name, resolved);
  } else if (parts.length === 2) {
    if (!sub) return;
    let rootCol = targetCollection.get(root.name);
    if (!(rootCol instanceof Collection)) {
      rootCol = new Collection();
      targetCollection.set(root.name, rootCol);
    }
    rootCol.set(sub.name, resolved);
  } else if (parts.length === 3) {
    if (!group || !sub) return;
    let rootCol = targetCollection.get(root.name);
    if (!(rootCol instanceof Collection)) {
      rootCol = new Collection();
      targetCollection.set(root.name, rootCol);
    }
    let groupCol = rootCol.get(group.name);
    if (!(groupCol instanceof Collection)) {
      groupCol = new Collection();
      rootCol.set(group.name, groupCol);
    }
    groupCol.set(sub.name, resolved);
  }
}

export function initSlashCommands(options: SlashesOptions = {}, instance: ForgeClient): void {
  client = instance;
  path = options.path !== undefined ? options.path : 'dist/slash';

  const mgr = client.applicationCommands as any;

  // Intercept mgr.add so any commands added via client.applicationCommands.add() are registered hierarchically without overwriting subcommands
  mgr.add = function (...values: any[]) {
    for (const value of values) {
      if (Array.isArray(value)) {
        mgr.add(...value);
      } else {
        registerSlashCommand(mgr.commands, value);
      }
    }
  };

  const originalLoadOne = mgr.loadOne?.bind(mgr);
  if (originalLoadOne) {
    mgr.loadOne = function (reqPath: string) {
      try {
        return originalLoadOne(reqPath);
      } catch (err: any) {
        console.warn(`[WARN] [slashes] Failed to load command file '${reqPath}':`, err?.message ?? err);
        return null;
      }
    };
  }

  const newCommands = new Collection<string, any>();

  // If commands were already present in mgr.commands, extract and preserve them
  if (mgr.commands && (mgr.commands instanceof Collection || mgr.commands instanceof Map)) {
    const existing: any[] = [];
    function extractExisting(val: any) {
      if (!val) return;
      if (val instanceof ApplicationCommand) {
        existing.push(val);
      } else if (val instanceof Collection || val instanceof Map) {
        for (const item of val.values()) {
          extractExisting(item);
        }
      }
    }
    extractExisting(mgr.commands);
    for (const cmd of existing) {
      registerSlashCommand(newCommands, cmd);
    }
  }

  // Set mgr.commands to newCommands early
  mgr.commands = newCommands;

  // Load from options.commands if provided
  if (options.commands && Array.isArray(options.commands)) {
    for (const cmd of options.commands) {
      registerSlashCommand(newCommands, cmd);
    }
  }

  // Load from path if provided and not empty
  if (path) {
    try {
      client.applicationCommands.load(path);
      const loaded: any[] = [];
      function extractLoaded(val: any) {
        if (!val) return;
        if (val instanceof ApplicationCommand) {
          loaded.push(val);
        } else if (val instanceof Collection || val instanceof Map) {
          for (const item of val.values()) {
            extractLoaded(item);
          }
        }
      }
      extractLoaded(newCommands);
      for (const cmd of loaded) {
        registerSlashCommand(newCommands, cmd);
      }
    } catch (err: any) {
      console.warn(`[WARN] [slashes] Error while loading slash commands from '${path}':`, err?.message ?? err);
    }
  }


  client.applicationCommands.toJSON = function (type: any = 0) {
    const arr: any[] = [];

    for (const rootCfg of Object.values(slashesConfig)) {
      if (typeof rootCfg === 'function') continue;
      const root = rootCfg as SlashCommandConfig;
      const loadedValue = (client!.applicationCommands as any).commands.get(root.name);
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
        if (root.type !== undefined && root.type !== type) continue;

        const options: any[] = [];

        if (root.options && root.options.length > 0) {
          options.push(...root.options);
        }

        if (root.subcommandGroups) {
          for (const group of Object.values(root.subcommandGroups) as any[]) {
            const groupCol = loadedValue.get(group.name);
            const groupSubOptions: any[] = [];

            if (group.subcommands) {
              for (const sub of Object.values(group.subcommands) as any[]) {
                const subCmd = groupCol instanceof Collection ? groupCol.get(sub.name) : undefined;
                if (!subCmd || !(subCmd instanceof ApplicationCommand)) continue;
                if (!subCmd.mustRegisterAs(type)) continue;

                groupSubOptions.push({
                  type: ApplicationCommandOptionType.Subcommand,
                  name: sub.name,
                  description: sub.description,
                  options: sub.options ?? [],
                });
              }
            }

            if (groupSubOptions.length > 0) {
              options.push({
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: group.name,
                description: group.description,
                options: groupSubOptions,
              });
            }
          }
        }

        if (root.subcommands) {
          for (const sub of Object.values(root.subcommands) as any[]) {
            const subCmd = loadedValue.get(sub.name);
            if (!subCmd || !(subCmd instanceof ApplicationCommand)) continue;
            if (!subCmd.mustRegisterAs(type)) continue;

            options.push({
              type: ApplicationCommandOptionType.Subcommand,
              name: sub.name,
              description: sub.description,
              options: sub.options ?? [],
            });
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
}

export class Slashes extends ForgeExtension {
  public name = 'Slashes';
  public description = 'Slash command manager for Nationdex';
  public version = '1.0.0';
  public options: SlashesOptions;

  public constructor(options: SlashesOptions = {}) {
    super();
    this.options = options;
  }

  public init(client: ForgeClient): void {
    initSlashCommands(this.options, client);
  }
}

export const slashes = new Slashes();

export function SlashCommand(
  pathKey: string,
  codeOrOptions: string | { code?: string; [key: string]: any }
): ApplicationCommand {
  try {
    const parts = pathKey.split('.');
    const rootKey = parts[0];
    const root = (slashesConfig as any)[rootKey];

    if (!root) {
      console.warn(`[WARN] [slashes] Root command '${rootKey}' not found in slash.ts. Skipping command '${pathKey}'.`);
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
        console.warn(`[WARN] [slashes] Subcommand '${subKey}' not found under '${rootKey}' in slash.ts. Skipping command '${pathKey}'.`);
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
        console.warn(`[WARN] [slashes] Subcommand '${subKey}' in group '${groupKey}' not found under '${rootKey}' in slash.ts. Skipping command '${pathKey}'.`);
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
      console.warn(`[WARN] [slashes] Invalid pathKey '${pathKey}' with ${parts.length} levels. Skipping command.`);
      return null as any;
    }

    const options = typeof codeOrOptions === 'string' ? { code: codeOrOptions } : codeOrOptions;

    const appCmd = new ApplicationCommand({
      ...options,
      data,
      independent,
      code: withBlacklistGuard(options.code ?? '', 'reply'),
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
    console.warn(`[WARN] [slashes] Error initializing command '${pathKey}':`, err?.message ?? err);
    return null as any;
  }
}

export const slashCommand = SlashCommand;

