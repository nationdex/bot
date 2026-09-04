import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Collection,
} from 'discord.js';
import { ApplicationCommand, ForgeClient, ForgeExtension } from '@tryforge/forgescript';
import { slashes as slashesConfig, SlashCommandConfig } from '../config/slash';

export interface SlashesOptions {
  path?: string;
}

let client: ForgeClient | null = null;
let path = 'dist/slash';

export function initSlashCommands(options: SlashesOptions = {}, instance: ForgeClient): void {
  client = instance;
  path = options.path ?? 'dist/slash';

  const mgr = client.applicationCommands as any;
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

  try {
    client.applicationCommands.load(path);
  } catch (err: any) {
    console.warn(`[WARN] [slashes] Error while loading slash commands from '${path}':`, err?.message ?? err);
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
    console.warn(`[WARN] [slashes] Error initializing command '${pathKey}':`, err?.message ?? err);
    return null as any;
  }
}

export const slashCommand = SlashCommand;

