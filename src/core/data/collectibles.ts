import fs from 'fs';
import path from 'path';
import { REST, Routes } from 'discord.js';
import { ForgeClient, ForgeExtension } from '@tryforge/forgescript';
import { variables } from '../../config/variables';
import { syncVariables } from './variables';

export interface ValidateCollectiblesOptions {
  applicationEmojis?: Set<string> | Array<{ id: string; name?: string } | string>;
}

export interface CollectiblesOptions extends ValidateCollectiblesOptions {
  fetchEmojis?: boolean;
  token?: string;
}

export interface ValidationReport {
  success: boolean;
  totalCollectibles: number;
  validCollectibles: number;
  errors: string[];
  warnings: string[];
  stats: {
    totalRarityWeight: number;
    totalAliases: number;
    totalEmojis: number;
  };
}

// IDs of every emoji a nation may use: the application's own emojis plus the emojis of the home server.
// Server emojis of other servers the bot is in also work in Discord, but cannot be audited from here.
export async function fetchApplicationEmojis(token?: string): Promise<Set<string> | null> {
  const authToken = token || process.env.TOKEN;
  if (!authToken) {
    return null;
  }

  try {
    const rest = new REST({ version: '10' }).setToken(authToken);
    const app: any = await rest.get(Routes.currentApplication());
    if (!app?.id) return null;

    const res: any = await rest.get(Routes.applicationEmojis(app.id));
    const emojis: any[] = Array.isArray(res) ? res : res?.items || [];
    const homeGuild = process.env.HOME_GUILD_ID;
    if (homeGuild) {
      const guildEmojis: any = await rest.get(Routes.guildEmojis(homeGuild)).catch(() => []);
      if (Array.isArray(guildEmojis)) emojis.push(...guildEmojis);
    }

    const emojiSet = new Set<string>();
    for (const em of emojis) {
      if (typeof em === 'string') emojiSet.add(em);
      else if (em?.id) emojiSet.add(String(em.id));
    }
    return emojiSet;
  } catch (err: any) {
    console.warn(`[WARN] [validateCollectibles] Could not fetch emojis from Discord API: ${err?.message ?? err}`);
    return null;
  }
}

export function validateCollectibles(options?: ValidateCollectiblesOptions): ValidationReport {
  const rootDir = process.cwd();
  const errors: string[] = [];
  const warnings: string[] = [];

  let appEmojiSet: Set<string> | null = null;
  if (options?.applicationEmojis) {
    if (options.applicationEmojis instanceof Set) {
      appEmojiSet = options.applicationEmojis;
    } else if (Array.isArray(options.applicationEmojis)) {
      appEmojiSet = new Set();
      for (const item of options.applicationEmojis) {
        if (typeof item === 'string') {
          appEmojiSet.add(item);
        } else if (item && typeof item === 'object') {
          if (item.id) appEmojiSet.add(item.id);
          if (item.name) appEmojiSet.add(item.name);
        }
      }
    }
  }

  const configPaths = (variables as any)?.config?.paths || {};
  const requiredPathKeys = ['spawn_art', 'window_art', 'icons', 'cards'];
  const resolvedPaths: Record<string, string> = {};

  for (const key of requiredPathKeys) {
    const rawPath = configPaths[key];
    if (!rawPath || typeof rawPath !== 'string') {
      errors.push(`Missing path configuration for '${key}' in config.paths variable`);
      continue;
    }

    const fullPath = path.isAbsolute(rawPath) ? rawPath : path.join(rootDir, rawPath);
    resolvedPaths[key] = fullPath;

    if (!fs.existsSync(fullPath)) {
      errors.push(`Configured path for '${key}' does not exist on disk: ${rawPath}`);
    } else {
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) {
        errors.push(`Configured path for '${key}' is not a directory: ${rawPath}`);
      }
    }
  }

  const aliasMap = new Map<string, string>();
  let totalRarityWeight = 0;
  let totalAliases = 0;
  let totalEmojis = 0;
  let validCollectibles = 0;
  let totalCollectibles = 0;

  let data: any = (variables as any)?.collectiblesData;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err: any) {
      errors.push(`Failed to parse collectiblesData: ${err.message}`);
      return {
        success: false,
        totalCollectibles: 0,
        validCollectibles: 0,
        errors,
        warnings,
        stats: { totalRarityWeight: 0, totalAliases: 0, totalEmojis: 0 },
      };
    }
  }

  const collectibles = data?.collectibles || {};
  const collectibleKeys = Object.keys(collectibles);
  totalCollectibles = collectibleKeys.length;

  if (totalCollectibles === 0) {
    warnings.push('collectiblesData has 0 collectibles loaded.');
  }

  const spawnArtDir = resolvedPaths.spawn_art;
  const windowArtDir = resolvedPaths.window_art;

  for (const id of collectibleKeys) {
    const col = collectibles[id];
    if (!col || typeof col !== 'object') {
      errors.push(`[${id}] Invalid collectible object in collectiblesData`);
      continue;
    }

    let isItemValid = true;

    if (col.id && col.id !== id) {
      errors.push(`[${id}] Key mismatch: Object contains id '${col.id}' but key is '${id}'`);
      isItemValid = false;
    }

    if (!col.name || typeof col.name !== 'string') {
      errors.push(`[${id}] Missing or invalid 'name' in collectiblesData`);
      isItemValid = false;
    }

    if (typeof col.health !== 'number' || isNaN(col.health)) {
      errors.push(`[${id}] Missing or invalid 'health' (must be a number)`);
      isItemValid = false;
    }

    if (typeof col.attack !== 'number' || isNaN(col.attack)) {
      errors.push(`[${id}] Missing or invalid 'attack' (must be a number)`);
      isItemValid = false;
    }

    if (typeof col.rarity !== 'number' || isNaN(col.rarity) || col.rarity <= 0) {
      errors.push(`[${id}] Invalid 'rarity' weight (${col.rarity}). Must be a positive number > 0`);
      isItemValid = false;
    } else {
      totalRarityWeight += col.rarity;
    }

    const emoji = col.emoji_id || col.emoji;
    if (!emoji || typeof emoji !== 'string' || emoji.trim().length === 0) {
      errors.push(`[${id}] Missing or invalid 'emoji_id' in collectiblesData (must be the ID of an application or server emoji)`);
      isItemValid = false;
    } else {
      totalEmojis++;
      if (appEmojiSet && appEmojiSet.size > 0) {
        const cleanEmoji = emoji.trim();
        if (!appEmojiSet.has(cleanEmoji)) {
          errors.push(`[${id}] Emoji '${cleanEmoji}' was not found among the application emojis or the home server emojis`);
          isItemValid = false;
        }
      }
    }

    if (!col.wild_card) {
      errors.push(`[${id}] Missing 'wild_card' image filename specification`);
      isItemValid = false;
    } else if (fs.existsSync(spawnArtDir)) {
      const spawnArtPath = path.join(spawnArtDir, col.wild_card);
      if (!fs.existsSync(spawnArtPath)) {
        errors.push(`[${id}] Missing spawn art image file: ${col.wild_card} in ${configPaths.spawn_art}`);
        isItemValid = false;
      } else {
        const stats = fs.statSync(spawnArtPath);
        if (stats.size === 0) {
          errors.push(`[${id}] Corrupt/empty (0-byte) spawn art image file: ${col.wild_card}`);
          isItemValid = false;
        }
      }
    }

    if (!col.collection_card) {
      warnings.push(`[${id}] Missing 'collection_card' image filename specification`);
    } else if (fs.existsSync(windowArtDir)) {
      const windowArtPath = path.join(windowArtDir, col.collection_card);
      if (!fs.existsSync(windowArtPath)) {
        warnings.push(`[${id}] Missing window art image file: ${col.collection_card} in ${configPaths.window_art}`);
      } else {
        const stats = fs.statSync(windowArtPath);
        if (stats.size === 0) {
          warnings.push(`[${id}] Corrupt/empty (0-byte) window art image file: ${col.collection_card}`);
        }
      }
    }

    const catchNames: string[] = Array.isArray(col.catch_names) ? col.catch_names : [];
    const translations: string[] = Array.isArray(col.translations) ? col.translations : [];
    const allAliases = [...catchNames, ...translations];

    if (catchNames.length === 0) {
      warnings.push(`[${id}] Has no 'catch_names' defined in collectiblesData! Players will not be able to catch it.`);
    }

    for (const alias of allAliases) {
      if (typeof alias !== 'string' || alias.trim().length === 0) {
        warnings.push(`[${id}] Contains an empty or non-string alias.`);
        continue;
      }

      totalAliases++;
      const normalized = alias.trim().toLowerCase();
      if (aliasMap.has(normalized)) {
        const existingId = aliasMap.get(normalized);
        warnings.push(`[${id}] Alias collision: '${normalized}' is already registered by [${existingId}]`);
      } else {
        aliasMap.set(normalized, id);
      }
    }

    if (isItemValid) {
      validCollectibles++;
    }
  }

  const success = errors.length === 0;

  console.log(`Total Audited: ${totalCollectibles}`);
  console.log(`Valid: ${validCollectibles} / ${totalCollectibles}`);
  console.log(`Total Emojis Validated: ${totalEmojis}`);
  console.log(`Total Aliases Indexed: ${totalAliases}`);

  if (appEmojiSet && appEmojiSet.size > 0) {
    console.log(`Application Emojis Verified via Discord API: ${appEmojiSet.size} emoji(s) indexed`);
  }

  if (errors.length > 0) {
    console.log(`Found ${errors.length} error(s):`);
    errors.slice(0, 15).forEach((e) => console.log(`  [ERROR] ${e}`));
    if (errors.length > 15) {
      console.log(`  ... and ${errors.length - 15} more errors`);
    }
  }

  if (warnings.length > 0) {
    console.log(`Found ${warnings.length} warning(s):`);
    warnings.slice(0, 10).forEach((w) => console.log(`  [WARN] ${w}`));
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more warnings`);
    }
  }

  if (success && warnings.length === 0) {
    console.log('All Nation Assets, emojis, and aliases are valid!');
  } else if (success) {
    console.log(`Audit passed with ${warnings.length} warning(s).`);
  } else {
    console.log(`Audit failed with ${errors.length} error(s).`);
  }

  return {
    success,
    totalCollectibles,
    validCollectibles,
    errors,
    warnings,
    stats: {
      totalRarityWeight,
      totalAliases,
      totalEmojis,
    },
  };
}

export async function initCollectibles(
  options: CollectiblesOptions = {},
  _instance?: ForgeClient
): Promise<ValidationReport> {
  let appEmojis = options.applicationEmojis;

  if (!appEmojis && options.fetchEmojis !== false) {
    const fetched = await fetchApplicationEmojis(options.token);
    if (fetched) {
      appEmojis = fetched;
    }
  }

  return validateCollectibles({
    ...options,
    applicationEmojis: appEmojis,
  });
}

export class Collectibles extends ForgeExtension {
  public name = 'Collectibles';
  public description = 'Collectibles validator for Nationdex';
  public version = '1.0.0';
  public options: CollectiblesOptions;

  public constructor(options: CollectiblesOptions = {}) {
    super();
    this.options = options;
  }

  public async init(client?: ForgeClient): Promise<ValidationReport> {
    return await initCollectibles(this.options, client);
  }

  public validate(options?: ValidateCollectiblesOptions): ValidationReport {
    return validateCollectibles(options ?? this.options);
  }
}

export const collectibles = new Collectibles();

export async function runCliValidation(): Promise<ValidationReport> {
  const { DataBase } = require('@nationdex/db/dist/util/database');
  const { TypedEmitter } = require('tiny-typed-emitter');

  const emitter = new TypedEmitter();
  const db = new DataBase(emitter, {
    folder: './database',
  });

  await db.init();
  await syncVariables();

  const report = await initCollectibles();

  try {
    if (typeof DataBase.pg?.close === 'function') {
      await DataBase.pg.close();
    }
  } catch {}

  return report;
}

if (require.main === module) {
  runCliValidation()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Validation CLI error:', err);
      process.exit(1);
    });
}
