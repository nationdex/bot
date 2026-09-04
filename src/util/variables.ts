import { ForgeClient, ForgeExtension } from '@tryforge/forgescript';
import { variables as defaults } from '../config/variables';

export interface VariablesOptions {
  db?: any;
  defaults?: Record<string, any>;
}

let client: ForgeClient | null = null;
let currentDb: any = null;

export async function syncVariables(clientInstance?: any): Promise<void> {
  try {
    const DataBase = clientInstance?.db ?? client?.db ?? require('@nationdex/db/dist/util').DataBase;
    if (!DataBase || !DataBase.db) {
      console.warn('Database is not ready yet, skipping variable synchronization.');
      return;
    }
    for (const name of Object.keys(defaults)) {
      const data = await DataBase.get({ name, type: 'custom' }).then((x: any) => x?.value);
      if (data !== null && data !== undefined) {
        const val =
          typeof data === 'string'
            ? (() => {
                try {
                  return JSON.parse(data);
                } catch {
                  return data;
                }
              })()
            : data;

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          (defaults as any)[name] = {
            ...(defaults as any)[name],
            ...val,
          };
        } else {
          (defaults as any)[name] = val;
        }
      }
    }
  } catch (err) {
    console.error('Failed to synchronize variables from database:', err);
  }
}

export async function initVariables(options: VariablesOptions = {}, instance: ForgeClient): Promise<void> {
  client = instance;
  const targetDb = options.db ?? currentDb ?? (client as any)?.db;

  if (targetDb && typeof targetDb.variables === 'function') {
    targetDb.variables(options.defaults ?? defaults);
  }

  if (targetDb?.emitter) {
    await new Promise<void>((resolve, reject) => {
      if (targetDb.db || (client as any)?.db?.db) {
        return resolve();
      }

      const timeoutMs = 15_000;
      let timer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        targetDb.emitter.off('connect', onConnect);
        targetDb.emitter.off('error', onError);
      };

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onError = (err: any) => {
        cleanup();
        reject(
          err instanceof Error
            ? err
            : new Error(`Database connection failed: ${err}`)
        );
      };

      timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Database connection timed out after ${timeoutMs / 1000}s. Check your database configuration, engine (${targetDb?.options?.engine || 'rocksdb'}), and storage directory (${targetDb?.options?.folder || './database'}).`
          )
        );
      }, timeoutMs);

      targetDb.emitter.once('connect', onConnect);
      targetDb.emitter.once('error', onError);
    });
  }

  await syncVariables(client);
}

export class Variables extends ForgeExtension {
  public name = 'Variables';
  public description = 'Variables manager for Nationdex';
  public version = '1.0.0';
  public options: VariablesOptions;

  public constructor(options: VariablesOptions = {}) {
    super();
    this.options = options;
  }

  public async init(client: ForgeClient, db?: any): Promise<void> {
    if (db) {
      currentDb = db;
    }
    await initVariables({ ...this.options, db: db ?? this.options.db }, client);
  }

  public async sync(clientInstance?: any): Promise<void> {
    await syncVariables(clientInstance ?? client);
  }
}

export const variables = new Variables();
