import { BaseCommand, ForgeClient, ForgeExtension } from '@tryforge/forgescript';
import { commands as commandsConfig } from '../config/commands';

export interface CommandsOptions {
  path?: string;
}

let client: ForgeClient | null = null;
let path = 'dist/commands';

export function initCommands(options: CommandsOptions = {}, instance: ForgeClient): void {
  client = instance;
  path = options.path ?? 'dist/commands';
  client.commands.load(path);
}

const initializer = initCommands;

export class Commands extends ForgeExtension {
  public name = 'Commands';
  public description = 'Command manager for Nationdex';
  public version = '1.0.0';
  public options: CommandsOptions;

  public constructor(options: CommandsOptions = {}) {
    super();
    this.options = options;
  }

  public init(client: ForgeClient): void {
    initializer(this.options, client);
  }
}

export const commands = new Commands();

export function command(
  pathKey: string,
  codeOrOptions: string | { code?: string; [key: string]: any }
): BaseCommand<any> {
  const parts = pathKey.split('.');
  let cfg: any = commandsConfig;
  for (const part of parts) {
    if (cfg && typeof cfg === 'object' && part in cfg) {
      cfg = cfg[part];
    } else {
      cfg = undefined;
      break;
    }
  }

  if (!cfg) {
    cfg = (commandsConfig as any)[pathKey];
  }

  if (!cfg) {
    console.warn(`[WARN] [commands] Command configuration for '${pathKey}' not found in commands.ts. Skipping.`);
    return null as any;
  }

  const options = typeof codeOrOptions === 'string' ? { code: codeOrOptions } : codeOrOptions;

  return new BaseCommand({
    ...cfg,
    ...options,
    code: options.code ?? '',
  });
};
