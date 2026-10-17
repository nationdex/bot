import { ArgType, ForgeClient, NativeFunction } from '@tryforge/forgescript';
import { DataBase } from '@nationdex/db/dist/util';
import { errors } from '../config/errors';
import { isAuthorizedDev, isAuthorizedDevSync } from './staff';
import { fetchUsername, usernameTag } from './usernames';

export type BlacklistTarget = 'user' | 'guild';
export type BlacklistAction = 'blacklist' | 'unblacklist';

export interface BlacklistEntry {
  reason: string;
  moderator: string;
  timestamp: number;
}

export interface BlacklistHistoryEntry extends BlacklistEntry {
  action: BlacklistAction;
}

export type BlacklistAddResult = 'added' | 'exists' | 'protected';
export type BlacklistRemoveResult = 'removed' | 'missing';

const ENTRY_VAR = 'blacklist';
const HISTORY_VAR = 'blacklistHistory';
const HISTORY_LIMIT = 100;

const cache: Record<BlacklistTarget, Map<string, BlacklistEntry>> = {
  user: new Map(),
  guild: new Map(),
};
let loading: Promise<void> | null = null;

function parse<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isTarget(value: unknown): value is BlacklistTarget {
  return value === 'user' || value === 'guild';
}

export function ensureBlacklistLoaded(): Promise<void> {
  loading ??= (async () => {
    for (const type of ['user', 'guild'] as const) {
      const rows = await DataBase.find({ name: ENTRY_VAR, type });
      cache[type].clear();
      for (const row of rows) {
        if (!row?.id) continue;
        cache[type].set(row.id, parse<BlacklistEntry>(row.value, { reason: '', moderator: '', timestamp: 0 }));
      }
    }
  })().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

export function resetBlacklistCache(): void {
  cache.user.clear();
  cache.guild.clear();
  loading = null;
}

export async function isBlacklisted(type: BlacklistTarget, id: string | null | undefined): Promise<boolean> {
  if (!id) return false;
  await ensureBlacklistLoaded();
  return cache[type].has(id);
}

export async function getBlacklistEntry(type: BlacklistTarget, id: string): Promise<BlacklistEntry | null> {
  await ensureBlacklistLoaded();
  return cache[type].get(id) ?? null;
}

export async function listBlacklist(type: BlacklistTarget): Promise<Array<BlacklistEntry & { id: string }>> {
  await ensureBlacklistLoaded();
  return [...cache[type].entries()]
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getBlacklistHistory(type: BlacklistTarget, id: string): Promise<BlacklistHistoryEntry[]> {
  const row = await DataBase.get({ name: HISTORY_VAR, type, id });
  return parse<BlacklistHistoryEntry[]>(row?.value, []);
}

async function pushHistory(type: BlacklistTarget, id: string, entry: BlacklistHistoryEntry): Promise<void> {
  const history = await getBlacklistHistory(type, id);
  history.unshift(entry);
  await DataBase.set({ name: HISTORY_VAR, type, id, value: JSON.stringify(history.slice(0, HISTORY_LIMIT)) });
}

export function isStaffSync(userId: string | null | undefined, client?: any): boolean {
  return isAuthorizedDevSync(userId, client);
}

export async function isStaff(userId: string | null | undefined, client?: any): Promise<boolean> {
  return isAuthorizedDev(userId, client);
}

export async function addBlacklist(
  type: BlacklistTarget,
  id: string,
  moderator: string,
  reason: string,
  client?: any,
): Promise<BlacklistAddResult> {
  await ensureBlacklistLoaded();
  if (type === 'user' && (id === moderator || id === client?.user?.id || (await isStaff(id, client)))) {
    return 'protected';
  }
  if (cache[type].has(id)) return 'exists';
  const entry: BlacklistEntry = { reason, moderator, timestamp: Date.now() };
  await DataBase.set({ name: ENTRY_VAR, type, id, value: JSON.stringify(entry) });
  cache[type].set(id, entry);
  await pushHistory(type, id, { ...entry, action: 'blacklist' });
  if (type === 'guild') await leaveGuild(client, id);
  return 'added';
}

export async function removeBlacklist(
  type: BlacklistTarget,
  id: string,
  moderator: string,
  reason: string,
): Promise<BlacklistRemoveResult> {
  await ensureBlacklistLoaded();
  if (!cache[type].has(id)) return 'missing';
  await DataBase.delete({ name: ENTRY_VAR, type, id });
  cache[type].delete(id);
  await pushHistory(type, id, { reason, moderator, timestamp: Date.now(), action: 'unblacklist' });
  return 'removed';
}

async function leaveGuild(client: any, guildId: string): Promise<void> {
  const guild = client?.guilds?.cache?.get(guildId);
  if (!guild) return;
  try {
    await guild.leave();
  } catch (err: any) {
    console.warn(`[WARN] [blacklist] Failed to leave guild ${guildId}:`, err?.message ?? err);
  }
}

const unix = (ms: number) => Math.floor(ms / 1000);
const oneLine = (text: string, max: number) => {
  const flat = (text || 'None').replace(/\s+/g, ' ').trim() || 'None';
  return flat.length > max ? `${flat.slice(0, max - 3)}...` : flat;
};
const who = async (client: any, id: string) => usernameTag(await fetchUsername(client, id));

export const PANEL_PAGE_SIZE = 10;
export const DETAIL_HISTORY_LIMIT = 10;

export interface BlacklistPageItem {
  id: string;
  line: string;
  label: string;
  description: string;
}

export interface BlacklistPage {
  type: BlacklistTarget;
  page: number;
  pages: number;
  total: number;
  body: string;
  items: BlacklistPageItem[];
}

function guildName(client: any, id: string): string {
  return client?.guilds?.cache?.get(id)?.name ?? '';
}

async function targetLabel(type: BlacklistTarget, id: string, client?: any): Promise<string> {
  if (type === 'user') return `${await who(client, id)} (\`${id}\`)`;
  const name = guildName(client, id);
  return name ? `**${oneLine(name, 60)}** (\`${id}\`)` : `Server \`${id}\``;
}

export async function buildBlacklistPage(
  type: BlacklistTarget,
  pageInput: unknown,
  size = PANEL_PAGE_SIZE,
  client?: any,
): Promise<BlacklistPage> {
  const entries = await listBlacklist(type);
  const pages = Math.max(1, Math.ceil(entries.length / size));
  const page = Math.min(Math.max(1, Math.floor(Number(pageInput)) || 1), pages);
  const slice = entries.slice((page - 1) * size, page * size);
  const items = await Promise.all(
    slice.map(async (e) => {
      const target = type === 'user' ? await fetchUsername(client, e.id) : '';
      const name = type === 'user' ? target : guildName(client, e.id);
      const subject = type === 'user' ? usernameTag(target) : `\`${e.id}\``;
      return {
        id: e.id,
        line: `- ${subject}${type === 'guild' && name ? ` ${oneLine(name, 40)}` : ''} · ${oneLine(e.reason, 80)} · by ${await who(client, e.moderator)} · <t:${unix(e.timestamp)}:R>`,
        label: oneLine(name || e.id, 100),
        description: oneLine(`${name ? `${e.id} · ` : ''}${e.reason || 'None'}`, 100),
      };
    }),
  );
  const noun = type === 'user' ? 'users' : 'servers';
  return {
    type,
    page,
    pages,
    total: entries.length,
    body: items.length ? items.map((i) => i.line).join('\n') : `- No blacklisted ${noun}.`,
    items,
  };
}

export async function buildBlacklistEntry(type: BlacklistTarget, id: string, client?: any) {
  const [entry, history] = await Promise.all([getBlacklistEntry(type, id), getBlacklistHistory(type, id)]);
  const entryModerator = entry ? await who(client, entry.moderator) : '';
  const status = entry
    ? [
        '- **Status:** Blacklisted',
        `- **Reason:** ${oneLine(entry.reason, 300)}`,
        `- **Moderator:** ${entryModerator} (\`${entry.moderator}\`)`,
        `- **Since:** <t:${unix(entry.timestamp)}:f> (<t:${unix(entry.timestamp)}:R>)`,
      ].join('\n')
    : '- **Status:** Not blacklisted';
  const recent = await Promise.all(
    history.slice(0, DETAIL_HISTORY_LIMIT).map(
      async (h) =>
        `- **${h.action === 'blacklist' ? 'Blacklisted' : 'Removed'}** · <t:${unix(h.timestamp)}:R> · by ${await who(client, h.moderator)} · ${oneLine(h.reason, 120)}`,
    ),
  );
  if (history.length > DETAIL_HISTORY_LIMIT) recent.push(`-# ...and ${history.length - DETAIL_HISTORY_LIMIT} older entries`);
  return {
    type,
    id,
    blacklisted: !!entry,
    title: `## Blacklist: ${await targetLabel(type, id, client)}`,
    status,
    history: recent.length ? recent.join('\n') : '- No history',
  };
}

const SNOWFLAKE = /^\d{15,25}$/;
const blank = (v: unknown) => v === undefined || v === null || v === '' || v === 'null';

// Exactly one of a user id / numeric guild id. type: user | guild | none | invalid.
export function resolveBlacklistTarget(user: unknown, guild: unknown): { type: string; id: string } {
  const hasUser = !blank(user);
  const hasGuild = !blank(guild);
  if (!hasUser && !hasGuild) return { type: 'none', id: '' };
  if (hasUser && hasGuild) return { type: 'invalid', id: '' };
  const id = String(hasUser ? user : guild).trim();
  if (!SNOWFLAKE.test(id)) return { type: 'invalid', id: '' };
  return { type: hasUser ? 'user' : 'guild', id };
}

export function initBlacklistEvents(client: ForgeClient): void {
  client.on('guildCreate', async (guild) => {
    try {
      if (await isBlacklisted('guild', guild.id)) await guild.leave();
    } catch (err: any) {
      console.warn(`[WARN] [blacklist] guildCreate check failed for ${guild.id}:`, err?.message ?? err);
    }
  });
  client.once('clientReady', async () => {
    try {
      await ensureBlacklistLoaded();
      for (const id of cache.guild.keys()) await leaveGuild(client, id);
    } catch (err: any) {
      console.warn('[WARN] [blacklist] Failed to load blacklist on ready:', err?.message ?? err);
    }
  });
}

const targetArg = {
  name: 'type',
  description: 'user or guild',
  rest: false,
  required: true,
  type: ArgType.String,
} as const;

const idArg = {
  name: 'id',
  description: 'The user or guild id',
  rest: false,
  required: true,
  type: ArgType.String,
} as const;

export const blacklistFunctions = [
  new NativeFunction({
    name: '$blacklistGuard',
    version: '1.0.0',
    description: 'Stops execution if the author or guild is blacklisted; mode "reply" sends an ephemeral notice on interactions',
    unwrap: true,
    brackets: false,
    args: [
      {
        name: 'mode',
        description: 'silent or reply',
        rest: false,
        required: false,
        type: ArgType.String,
      },
    ],
    async execute(ctx, [mode]) {
      const userId = ctx.user?.id;
      const guildId = ctx.guild?.id ?? (ctx.interaction as any)?.guildId ?? null;
      let reason: string | null = null;
      if (await isBlacklisted('user', userId)) reason = errors.blacklisted_user;
      else if (await isBlacklisted('guild', guildId)) reason = errors.blacklisted_guild;
      if (!reason || isStaffSync(userId, ctx.client)) return this.success();

      const i: any = ctx.interaction;
      if (mode === 'reply' && i?.isRepliable?.() && !i.replied && !i.deferred) {
        try {
          await i.reply({ content: reason, flags: 64 });
        } catch {
          // interaction may already be acknowledged elsewhere
        }
      }
      return this.stop();
    },
  }),

  new NativeFunction({
    name: '$isBlacklisted',
    version: '1.0.0',
    description: 'Returns whether a user or guild is blacklisted',
    unwrap: true,
    brackets: true,
    output: ArgType.Boolean,
    args: [targetArg, idArg],
    async execute(_ctx, [type, id]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      return this.success(await isBlacklisted(type, id));
    },
  }),

  new NativeFunction({
    name: '$isBotStaff',
    version: '1.0.0',
    description: 'Returns whether a user is a bot developer or application owner',
    unwrap: true,
    brackets: true,
    output: ArgType.Boolean,
    args: [{ name: 'user', description: 'The user id', rest: false, required: true, type: ArgType.String }],
    async execute(ctx, [user]) {
      return this.success(await isStaff(user, ctx.client));
    },
  }),

  new NativeFunction({
    name: '$blacklistAdd',
    version: '1.0.0',
    description: 'Blacklists a user or guild. Returns added, exists or protected',
    unwrap: true,
    brackets: true,
    output: ArgType.String,
    args: [
      targetArg,
      idArg,
      { name: 'moderator', description: 'Moderator user id', rest: false, required: true, type: ArgType.String },
      { name: 'reason', description: 'Reason', rest: false, required: false, type: ArgType.String },
    ],
    async execute(ctx, [type, id, moderator, reason]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      return this.success(await addBlacklist(type, id, moderator, reason ?? '', ctx.client));
    },
  }),

  new NativeFunction({
    name: '$blacklistRemove',
    version: '1.0.0',
    description: 'Removes a user or guild from the blacklist. Returns removed or missing',
    unwrap: true,
    brackets: true,
    output: ArgType.String,
    args: [
      targetArg,
      idArg,
      { name: 'moderator', description: 'Moderator user id', rest: false, required: true, type: ArgType.String },
      { name: 'reason', description: 'Reason', rest: false, required: false, type: ArgType.String },
    ],
    async execute(_ctx, [type, id, moderator, reason]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      return this.success(await removeBlacklist(type, id, moderator, reason ?? ''));
    },
  }),

  new NativeFunction({
    name: '$blacklistInfo',
    version: '1.0.0',
    description: 'Returns a blacklist entry as JSON, or one property (reason, moderator, timestamp, unix); empty if not blacklisted',
    unwrap: true,
    brackets: true,
    output: ArgType.Unknown,
    args: [
      targetArg,
      idArg,
      { name: 'property', description: 'Property to return', rest: false, required: false, type: ArgType.String },
    ],
    async execute(_ctx, [type, id, property]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      const entry = await getBlacklistEntry(type, id);
      if (!entry) return this.success('');
      const full = { ...entry, unix: unix(entry.timestamp) };
      if (!property) return this.successJSON(full);
      return this.success(String((full as any)[property] ?? ''));
    },
  }),

  new NativeFunction({
    name: '$blacklistTarget',
    version: '1.0.0',
    description: 'Validates a user id / guild id pair (exactly one allowed). Returns type (user, guild, none, invalid) or id',
    unwrap: true,
    brackets: true,
    output: ArgType.String,
    args: [
      { name: 'user', description: 'User id option', rest: false, required: false, type: ArgType.String },
      { name: 'guild', description: 'Guild id option', rest: false, required: false, type: ArgType.String },
      { name: 'property', description: 'type or id', rest: false, required: true, type: ArgType.String },
    ],
    execute(_ctx, [user, guild, property]) {
      const target = resolveBlacklistTarget(user, guild);
      return this.success(property === 'id' ? target.id : target.type);
    },
  }),

  new NativeFunction({
    name: '$blacklistPage',
    version: '1.0.0',
    description: 'Returns one page of the blacklist as JSON: type, page, pages, total, body (bullet lines) and items (id, label, description)',
    unwrap: true,
    brackets: true,
    output: ArgType.Json,
    args: [
      targetArg,
      { name: 'page', description: 'Page number', rest: false, required: false, type: ArgType.String },
      { name: 'size', description: 'Entries per page', rest: false, required: false, type: ArgType.Number },
    ],
    async execute(ctx, [type, page, size]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      return this.successJSON(await buildBlacklistPage(type, page, Math.min(25, size ?? PANEL_PAGE_SIZE), ctx.client));
    },
  }),

  new NativeFunction({
    name: '$blacklistEntry',
    version: '1.0.0',
    description: 'Returns the detail of one target as JSON: blacklisted, title, status (bullets) and history (bullets, newest first)',
    unwrap: true,
    brackets: true,
    output: ArgType.Json,
    args: [targetArg, idArg],
    async execute(ctx, [type, id]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      return this.successJSON(await buildBlacklistEntry(type, id, ctx.client));
    },
  }),

  new NativeFunction({
    name: '$blacklistCount',
    version: '1.0.0',
    description: 'Returns the number of blacklisted users or guilds',
    unwrap: true,
    brackets: true,
    output: ArgType.Number,
    args: [targetArg],
    async execute(_ctx, [type]) {
      if (!isTarget(type)) return this.customError('Type must be "user" or "guild"');
      return this.success((await listBlacklist(type)).length);
    },
  }),
];
