import { ArgType, ForgeClient, NativeFunction } from '@tryforge/forgescript';
import { DataBase } from '@nationdex/db/dist/util';
import { createHash } from 'crypto';
import { fetchUsername } from './usernames';

// Bot staff access control. Identity is a Discord user id stored in the database; Discord permissions
// (Administrator, ManageGuild, team membership) never grant anything here. Staff capabilities only work
// inside the home server (HOME_GUILD_ID); everything is denied by default.

export const CAPABILITIES = [
  'eval.run',
  'suggestions.review',
  'suggestions.approve',
  'blacklist.read',
  'blacklist.write',
  'auction.moderate',
  'users.edit',
  'nations.edit',
  'cards.edit',
  'config.edit',
  'access.manage',
] as const;

// Holding one of these requires the grantor to be an owner ('*').
const OWNER_ONLY = new Set(['*', 'eval.run', 'config.edit']);
// Always read from the database so a revocation applies immediately.
const SENSITIVE = new Set(['*', 'eval.run', 'access.manage', 'config.edit', 'users.edit']);

const CACHE_TTL = 30_000;
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;
const ROLE_NAME = /^[a-z][a-z0-9_-]{1,31}$/;
const SNOWFLAKE = /^\d{15,25}$/;

interface CacheEntry {
  at: number;
  caps: Set<string>;
  any: boolean;
}

const cache = new Map<string, CacheEntry>();
const mutations = new Map<string, number[]>();
let warnedHome = false;

const pg = () => (DataBase as any).pg;

export function homeGuildId(): string | null {
  const id = process.env.HOME_GUILD_ID?.trim();
  if (id && SNOWFLAKE.test(id)) return id;
  if (!warnedHome) {
    warnedHome = true;
    console.warn('[WARN] [access] HOME_GUILD_ID is not set to a valid server id; every staff capability is denied.');
  }
  return null;
}

export function isValidCapability(value: string): boolean {
  if (value === '*') return true;
  if ((CAPABILITIES as readonly string[]).includes(value)) return true;
  if (value.endsWith('.*')) {
    const prefix = value.slice(0, -1);
    return (CAPABILITIES as readonly string[]).some((c) => c.startsWith(prefix));
  }
  return false;
}

// Whether a held capability set grants `cap` (exact, namespace wildcard or '*').
export function grants(held: Iterable<string>, cap: string): boolean {
  for (const h of held) {
    if (h === '*' || h === cap) return true;
    if (h.endsWith('.*') && cap.startsWith(h.slice(0, -1))) return true;
  }
  return false;
}

export function invalidate(userId?: string): void {
  if (userId) cache.delete(userId);
  else cache.clear();
}

async function loadEntry(userId: string): Promise<CacheEntry> {
  const res = await pg().query(
    `SELECT g.subject, g.kind, r.capabilities
       FROM access_grant g
       LEFT JOIN access_role r ON g.kind = 'role' AND r.name = g.subject
      WHERE g.user_id = $1 AND (g.expires_at IS NULL OR g.expires_at > now())`,
    [userId],
  );
  const caps = new Set<string>();
  for (const row of res.rows) {
    if (row.kind === 'capability') caps.add(row.subject);
    else if (Array.isArray(row.capabilities)) for (const c of row.capabilities) caps.add(String(c));
  }
  return { at: Date.now(), caps, any: res.rows.length > 0 };
}

async function entryFor(userId: string, fresh: boolean): Promise<CacheEntry> {
  const hit = cache.get(userId);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL) return hit;
  const entry = await loadEntry(userId);
  cache.set(userId, entry);
  return entry;
}

export async function userCaps(userId: string): Promise<Set<string>> {
  return (await entryFor(userId, true)).caps;
}

async function blacklisted(userId: string): Promise<boolean> {
  // lazy: blacklist.ts depends on this module for its staff bypass
  const { isBlacklisted } = require('./blacklist');
  return isBlacklisted('user', userId);
}

export interface CanOptions {
  guildId?: string | null;
  // allow a direct message (no guild) context, used by eval only
  dm?: boolean;
}

export async function can(userId: string | null | undefined, cap: string, opts: CanOptions = {}): Promise<boolean> {
  if (!userId || !pg()) return false;
  const home = homeGuildId();
  if (!home) return false;
  if (opts.guildId) {
    if (opts.guildId !== home) return false;
  } else if (!opts.dm) {
    return false;
  }
  if (await blacklisted(userId)) return false;
  const entry = await entryFor(userId, SENSITIVE.has(cap));
  return grants(entry.caps, cap);
}

// True for anyone holding at least one active grant. Used for the blacklist bypass and protection.
export async function hasAnyAccess(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !pg()) return false;
  return (await entryFor(userId, false)).any;
}

export function hasAnyAccessSync(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const hit = cache.get(userId);
  return !!hit && hit.any && Date.now() - hit.at < CACHE_TTL;
}

export async function audit(actor: string, action: string, target: string | null, detail: string | null): Promise<void> {
  await pg().query('INSERT INTO access_audit (actor_id, action, target_id, detail) VALUES ($1, $2, $3, $4)', [
    actor,
    action,
    target,
    detail,
  ]);
}

export function resetRateLimits(): void {
  mutations.clear();
}

function rateOk(actor: string): boolean {
  const now = Date.now();
  const recent = (mutations.get(actor) ?? []).filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) {
    mutations.set(actor, recent);
    return false;
  }
  recent.push(now);
  mutations.set(actor, recent);
  return true;
}

async function owners(): Promise<string[]> {
  const res = await pg().query(
    `SELECT DISTINCT g.user_id
       FROM access_grant g
       JOIN access_role r ON g.kind = 'role' AND r.name = g.subject
      WHERE r.capabilities ? '*' AND (g.expires_at IS NULL OR g.expires_at > now())`,
  );
  return res.rows.map((r: any) => r.user_id);
}

// Direct messages every owner so a takeover or escalation is visible.
export async function notifyOwners(client: any, text: string): Promise<void> {
  try {
    for (const id of await owners()) {
      try {
        const user = await client.users.fetch(id);
        await user.send(text);
      } catch {
        // owner has DMs closed
      }
    }
  } catch {
    // never let a notification failure break the action itself
  }
}

async function subjectCaps(subject: string): Promise<{ kind: 'role' | 'capability'; caps: string[] } | null> {
  const role = await pg().query('SELECT capabilities FROM access_role WHERE name = $1', [subject]);
  if (role.rows.length) return { kind: 'role', caps: (role.rows[0].capabilities as string[]).map(String) };
  if (isValidCapability(subject)) return { kind: 'capability', caps: [subject] };
  return null;
}

// Every capability in `needed` must be covered by what the actor holds.
function covers(held: Set<string>, needed: string[]): boolean {
  return needed.every((n) => {
    if (held.has('*') || held.has(n)) return true;
    // a namespace wildcard can only be delegated by someone holding that same wildcard
    if (n.endsWith('.*')) return false;
    return grants(held, n);
  });
}

async function actorAllowed(actor: string, guildId: string | null | undefined): Promise<Set<string> | null> {
  if (!(await can(actor, 'access.manage', { guildId }))) return null;
  if (!rateOk(actor)) return null;
  return userCaps(actor);
}

export type AccessStatus =
  | 'ok'
  | 'denied'
  | 'rate'
  | 'unknown'
  | 'self'
  | 'bot'
  | 'owner_only'
  | 'missing'
  | 'last_owner'
  | 'invalid'
  | 'protected'
  | 'claimed'
  | 'limit'
  | 'not_app_owner';

export async function grantAccess(
  client: any,
  actor: string,
  guildId: string | null | undefined,
  target: string,
  subject: string,
  hours: number | null,
  reason: string,
): Promise<AccessStatus> {
  if (!(await can(actor, 'access.manage', { guildId }))) return 'denied';
  if (!rateOk(actor)) return 'rate';
  const held = await userCaps(actor);
  if (!SNOWFLAKE.test(target)) return 'invalid';
  if (target === actor) return 'self';
  const user = await client.users.fetch(target).catch(() => null);
  if (!user) return 'invalid';
  if (user.bot) return 'bot';
  const sub = await subjectCaps(subject);
  if (!sub) return 'unknown';
  if (sub.caps.some((c) => OWNER_ONLY.has(c)) && !held.has('*')) return 'owner_only';
  if (!covers(held, sub.caps)) return 'denied';
  const expires = hours && hours > 0 ? new Date(Date.now() + hours * 3_600_000) : null;
  await pg().query(
    `INSERT INTO access_grant (user_id, subject, kind, expires_at, granted_by, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, subject) DO UPDATE
       SET expires_at = EXCLUDED.expires_at, granted_by = EXCLUDED.granted_by, granted_at = now(), reason = EXCLUDED.reason`,
    [target, subject, sub.kind, expires, actor, reason || null],
  );
  invalidate(target);
  await audit(actor, 'grant', target, `${subject}${expires ? ` until ${expires.toISOString()}` : ''}${reason ? ` | ${reason}` : ''}`);
  if (sub.caps.some((c) => SENSITIVE.has(c))) {
    await notifyOwners(
      client,
      `Access granted: \`${await fetchUsername(client, actor)}\` gave \`${subject}\` to \`${await fetchUsername(client, target)}\`${expires ? ` until <t:${Math.floor(expires.getTime() / 1000)}:f>` : ''}.`,
    );
  }
  return 'ok';
}

export async function revokeAccess(
  client: any,
  actor: string,
  guildId: string | null | undefined,
  target: string,
  subject: string,
): Promise<AccessStatus> {
  const held = await actorAllowed(actor, guildId);
  if (!held) return (await can(actor, 'access.manage', { guildId })) ? 'rate' : 'denied';
  if (!SNOWFLAKE.test(target)) return 'invalid';
  const row = await pg().query('SELECT kind FROM access_grant WHERE user_id = $1 AND subject = $2', [target, subject]);
  if (!row.rows.length) return 'missing';
  const sub = await subjectCaps(subject);
  const needed = sub?.caps ?? [];
  if (needed.some((c) => OWNER_ONLY.has(c)) && !held.has('*')) return 'owner_only';
  if (!covers(held, needed)) return 'denied';
  if (needed.includes('*')) {
    const remaining = (await owners()).filter((id) => id !== target);
    if (!remaining.length) return 'last_owner';
  }
  await pg().query('DELETE FROM access_grant WHERE user_id = $1 AND subject = $2', [target, subject]);
  invalidate(target);
  await audit(actor, 'revoke', target, subject);
  if (needed.some((c) => SENSITIVE.has(c))) {
    await notifyOwners(
      client,
      `Access revoked: \`${await fetchUsername(client, actor)}\` removed \`${subject}\` from \`${await fetchUsername(client, target)}\`.`,
    );
  }
  return 'ok';
}

export async function setRole(
  client: any,
  actor: string,
  guildId: string | null | undefined,
  name: string,
  capabilities: string[],
): Promise<AccessStatus> {
  const held = await actorAllowed(actor, guildId);
  if (!held) return (await can(actor, 'access.manage', { guildId })) ? 'rate' : 'denied';
  if (!ROLE_NAME.test(name)) return 'invalid';
  if (name === 'owner') return 'protected';
  const caps = [...new Set(capabilities.map((c) => c.trim()).filter(Boolean))];
  if (!caps.length || caps.some((c) => !isValidCapability(c))) return 'unknown';
  if (caps.some((c) => OWNER_ONLY.has(c)) && !held.has('*')) return 'owner_only';
  if (!covers(held, caps)) return 'denied';
  await pg().query(
    `INSERT INTO access_role (name, capabilities) VALUES ($1, $2::jsonb)
     ON CONFLICT (name) DO UPDATE SET capabilities = EXCLUDED.capabilities`,
    [name, JSON.stringify(caps)],
  );
  invalidate();
  await audit(actor, 'role-set', null, `${name}: ${caps.join(', ')}`);
  if (caps.some((c) => SENSITIVE.has(c))) {
    await notifyOwners(client, `Role \`${name}\` was changed by \`${await fetchUsername(client, actor)}\`: ${caps.join(', ')}.`);
  }
  return 'ok';
}

export async function deleteRole(
  client: any,
  actor: string,
  guildId: string | null | undefined,
  name: string,
): Promise<AccessStatus> {
  const held = await actorAllowed(actor, guildId);
  if (!held) return (await can(actor, 'access.manage', { guildId })) ? 'rate' : 'denied';
  if (name === 'owner') return 'protected';
  const role = await pg().query('SELECT capabilities FROM access_role WHERE name = $1', [name]);
  if (!role.rows.length) return 'missing';
  const caps = (role.rows[0].capabilities as string[]).map(String);
  if (caps.some((c) => OWNER_ONLY.has(c)) && !held.has('*')) return 'owner_only';
  if (!covers(held, caps)) return 'denied';
  await pg().query("DELETE FROM access_grant WHERE kind = 'role' AND subject = $1", [name]);
  await pg().query('DELETE FROM access_role WHERE name = $1', [name]);
  invalidate();
  await audit(actor, 'role-delete', null, name);
  await notifyOwners(client, `Role \`${name}\` was deleted by \`${await fetchUsername(client, actor)}\`.`);
  return 'ok';
}

// Verified by Discord itself: the application owner, or the owner of the team that owns the application.
export async function isApplicationOwner(client: any, userId: string): Promise<boolean> {
  try {
    if (client?.application && !client.application.owner) await client.application.fetch();
    const owner = client?.application?.owner;
    if (!owner) return false;
    if (typeof owner.ownerId === 'string') return owner.ownerId === userId;
    return owner.id === userId;
  } catch {
    return false;
  }
}

export async function claimOwnership(client: any, userId: string, guildId: string | null | undefined): Promise<AccessStatus> {
  const home = homeGuildId();
  if (!home || guildId !== home) return 'denied';
  if (!rateOk(userId)) return 'rate';
  if ((await owners()).length) return 'claimed';
  if (!(await isApplicationOwner(client, userId))) {
    await audit(userId, 'claim-denied', null, 'not the application owner');
    return 'not_app_owner';
  }
  await pg().query(
    `INSERT INTO access_grant (user_id, subject, kind, granted_by, reason)
     VALUES ($1, 'owner', 'role', $1, 'claimed as application owner')
     ON CONFLICT (user_id, subject) DO UPDATE SET expires_at = NULL`,
    [userId],
  );
  invalidate(userId);
  await audit(userId, 'claim', userId, 'application owner');
  return 'ok';
}

const MAX_TOKENS = 3;

// API tokens only identify a user. Every API call re-checks that user's capabilities, so revoking a role also cuts API access.
export async function createToken(userId: string, guildId: string | null | undefined): Promise<{ status: AccessStatus; token?: string }> {
  const home = homeGuildId();
  if (!home || guildId !== home || !(await hasAnyAccess(userId))) return { status: 'denied' };
  if (!rateOk(userId)) return { status: 'rate' };
  const held = await pg().query('SELECT count(*)::int AS n FROM access_token WHERE user_id = $1', [userId]);
  if ((held.rows[0]?.n ?? 0) >= MAX_TOKENS) return { status: 'limit' };
  const token = `ndx_${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')}`;
  await pg().query('INSERT INTO access_token (hash, user_id) VALUES ($1, $2)', [createHash('sha256').update(token).digest('hex'), userId]);
  await audit(userId, 'token-create', userId, null);
  return { status: 'ok', token };
}

export async function revokeTokens(actor: string, guildId: string | null | undefined, target: string): Promise<AccessStatus> {
  const home = homeGuildId();
  if (!home || guildId !== home) return 'denied';
  if (target !== actor && !(await can(actor, 'access.manage', { guildId }))) return 'denied';
  if (!rateOk(actor)) return 'rate';
  if (!SNOWFLAKE.test(target)) return 'invalid';
  const res = await pg().query('DELETE FROM access_token WHERE user_id = $1 RETURNING hash', [target]);
  if (!res.rows.length) return 'missing';
  await audit(actor, 'token-revoke', target, `${res.rows.length} token(s)`);
  return 'ok';
}

export async function getSetting(key: string): Promise<string | null> {
  const res = await pg().query('SELECT value FROM access_setting WHERE key = $1', [key]);
  return res.rows[0]?.value ?? null;
}

export async function setEvalChannel(
  client: any,
  actor: string,
  guildId: string | null | undefined,
  channelId: string | null,
): Promise<AccessStatus> {
  if (!(await can(actor, '*', { guildId }))) return 'owner_only';
  if (!rateOk(actor)) return 'rate';
  if (channelId && !SNOWFLAKE.test(channelId)) return 'invalid';
  if (channelId) {
    await pg().query(
      `INSERT INTO access_setting (key, value) VALUES ('eval_channel', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [channelId],
    );
  } else {
    await pg().query("DELETE FROM access_setting WHERE key = 'eval_channel'");
  }
  await audit(actor, 'eval-channel', channelId, channelId ? 'set' : 'cleared');
  return 'ok';
}

// Eval is limited to the home server (optionally one control channel) or a direct message.
export async function evalAllowedIn(guildId: string | null | undefined, channelId: string | null | undefined): Promise<boolean> {
  if (!guildId) return true;
  const home = homeGuildId();
  if (!home || guildId !== home) return false;
  const control = await getSetting('eval_channel');
  return !control || control === channelId;
}

const stamp = (d: unknown) => (d ? `<t:${Math.floor(new Date(d as string).getTime() / 1000)}:R>` : 'never');

export async function describeUser(client: any, userId: string): Promise<string> {
  const res = await pg().query(
    `SELECT subject, kind, expires_at, granted_by, granted_at
       FROM access_grant WHERE user_id = $1 ORDER BY granted_at DESC`,
    [userId],
  );
  const name = await fetchUsername(client, userId);
  if (!res.rows.length) return `\`${name}\` has no access grants.`;
  const lines: string[] = [];
  for (const r of res.rows) {
    const expired = r.expires_at && new Date(r.expires_at).getTime() <= Date.now();
    lines.push(
      `- \`${r.subject}\` (${r.kind})${expired ? ' **expired**' : ''} · expires ${stamp(r.expires_at)} · by \`${await fetchUsername(client, r.granted_by)}\``,
    );
  }
  return `**Access for \`${name}\`**\n${lines.join('\n')}`;
}

export async function describeRoles(): Promise<string> {
  const res = await pg().query('SELECT name, capabilities FROM access_role ORDER BY name');
  const lines = res.rows.map((r: any) => `- \`${r.name}\`: ${(r.capabilities as string[]).map((c) => `\`${c}\``).join(', ')}`);
  return `**Roles**\n${lines.join('\n')}\n\n**Capabilities**\n${CAPABILITIES.map((c) => `\`${c}\``).join(', ')}`;
}

export async function describeAudit(client: any, limit: number): Promise<string> {
  const res = await pg().query('SELECT actor_id, action, target_id, detail, at FROM access_audit ORDER BY id DESC LIMIT $1', [limit]);
  if (!res.rows.length) return 'No audit entries.';
  const lines: string[] = [];
  for (const r of res.rows) {
    const target = r.target_id ? ` -> \`${await fetchUsername(client, r.target_id)}\`` : '';
    lines.push(`- ${stamp(r.at)} \`${await fetchUsername(client, r.actor_id)}\` **${r.action}**${target}${r.detail ? ` · ${String(r.detail).slice(0, 120)}` : ''}`);
  }
  return `**Recent access audit**\n${lines.join('\n')}`;
}

function guildOf(ctx: any): string | null {
  return ctx.guild?.id ?? ctx.interaction?.guildId ?? null;
}

const str = (name: string, description: string, required = true) =>
  ({ name, description, rest: false, required, type: ArgType.String }) as const;

export const accessFunctions = [
  new NativeFunction({
    name: '$hasCap',
    version: '1.0.0',
    description: 'Returns whether a user holds a staff capability in the current server (home server only)',
    unwrap: true,
    brackets: true,
    output: ArgType.Boolean,
    args: [str('user', 'The user id'), str('capability', 'The capability, e.g. blacklist.write')],
    async execute(ctx, [user, capability]) {
      return this.success(await can(String(user), String(capability), { guildId: guildOf(ctx) }));
    },
  }),

  new NativeFunction({
    name: '$accessClaim',
    version: '1.0.0',
    description: 'Claims ownership for the verified application owner while no owner exists. Returns a status',
    unwrap: true,
    brackets: false,
    args: [],
    async execute(ctx) {
      return this.success(await claimOwnership(ctx.client, ctx.user?.id ?? '', guildOf(ctx)));
    },
  }),

  new NativeFunction({
    name: '$accessGrant',
    version: '1.0.0',
    description: 'Grants a role or capability to a user. Returns a status',
    unwrap: true,
    brackets: true,
    args: [
      str('target', 'The user id'),
      str('subject', 'A role name or capability'),
      str('hours', 'Hours until the grant expires, 0 or empty for never', false),
      str('reason', 'Why', false),
    ],
    async execute(ctx, [target, subject, hours, reason]) {
      const h = Number(hours);
      return this.success(
        await grantAccess(ctx.client, ctx.user?.id ?? '', guildOf(ctx), String(target), String(subject), Number.isFinite(h) && h > 0 ? h : null, String(reason ?? '').replace(/^null$/, '')),
      );
    },
  }),

  new NativeFunction({
    name: '$accessRevoke',
    version: '1.0.0',
    description: 'Revokes a role or capability from a user. Returns a status',
    unwrap: true,
    brackets: true,
    args: [str('target', 'The user id'), str('subject', 'A role name or capability')],
    async execute(ctx, [target, subject]) {
      return this.success(await revokeAccess(ctx.client, ctx.user?.id ?? '', guildOf(ctx), String(target), String(subject)));
    },
  }),

  new NativeFunction({
    name: '$accessSetRole',
    version: '1.0.0',
    description: 'Creates or replaces a role from a comma separated capability list. Returns a status',
    unwrap: true,
    brackets: true,
    args: [str('name', 'The role name'), str('capabilities', 'Comma separated capabilities')],
    async execute(ctx, [name, caps]) {
      return this.success(await setRole(ctx.client, ctx.user?.id ?? '', guildOf(ctx), String(name), String(caps).split(',')));
    },
  }),

  new NativeFunction({
    name: '$accessDeleteRole',
    version: '1.0.0',
    description: 'Deletes a role and every grant of it. Returns a status',
    unwrap: true,
    brackets: true,
    args: [str('name', 'The role name')],
    async execute(ctx, [name]) {
      return this.success(await deleteRole(ctx.client, ctx.user?.id ?? '', guildOf(ctx), String(name)));
    },
  }),

  new NativeFunction({
    name: '$accessEvalChannel',
    version: '1.0.0',
    description: 'Sets or clears (empty) the eval control channel. Owner only. Returns a status',
    unwrap: true,
    brackets: true,
    args: [str('channel', 'The channel id, or empty to clear', false)],
    async execute(ctx, [channel]) {
      const id = String(channel ?? '').replace(/^null$/, '');
      return this.success(await setEvalChannel(ctx.client, ctx.user?.id ?? '', guildOf(ctx), id || null));
    },
  }),

  new NativeFunction({
    name: '$accessToken',
    version: '1.0.0',
    description: 'Creates an API token for the caller and returns it once, or a status such as denied or limit',
    unwrap: true,
    brackets: false,
    args: [],
    async execute(ctx) {
      const r = await createToken(ctx.user?.id ?? '', guildOf(ctx));
      return this.success(r.status === 'ok' ? `ok:${r.token}` : r.status);
    },
  }),

  new NativeFunction({
    name: '$accessTokenRevoke',
    version: '1.0.0',
    description: 'Revokes every API token of a user (the caller when empty). Returns a status',
    unwrap: true,
    brackets: true,
    args: [str('user', 'The user id, or empty for yourself', false)],
    async execute(ctx, [user]) {
      const id = String(user ?? '').replace(/^null$/, '') || (ctx.user?.id ?? '');
      return this.success(await revokeTokens(ctx.user?.id ?? '', guildOf(ctx), id));
    },
  }),

  new NativeFunction({
    name: '$accessList',
    version: '1.0.0',
    description: 'Describes the grants of a user, or the roles when no user is given. Requires access.manage',
    unwrap: true,
    brackets: true,
    args: [str('user', 'The user id, or empty for roles', false)],
    async execute(ctx, [user]) {
      if (!(await can(ctx.user?.id, 'access.manage', { guildId: guildOf(ctx) }))) return this.success('denied');
      const id = String(user ?? '').replace(/^null$/, '');
      return this.success(id ? await describeUser(ctx.client, id) : await describeRoles());
    },
  }),

  new NativeFunction({
    name: '$accessAudit',
    version: '1.0.0',
    description: 'Lists the most recent access audit entries. Requires access.manage',
    unwrap: true,
    brackets: true,
    args: [str('limit', 'Maximum entries', false)],
    async execute(ctx, [limit]) {
      if (!(await can(ctx.user?.id, 'access.manage', { guildId: guildOf(ctx) }))) return this.success('denied');
      const n = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 25);
      return this.success(await describeAudit(ctx.client, n));
    },
  }),
];

// Staff commands live in the home server only; register them there instead of globally.
export function initAccessEvents(client: ForgeClient): void {
  client.once('clientReady', async () => {
    const home = homeGuildId();
    if (!home) return;
    try {
      const guild = await client.guilds.fetch(home);
      await (client as any).applicationCommands.registerGuild(guild);
    } catch (err: any) {
      console.warn('[WARN] [access] Failed to register staff commands in the home server:', err?.message ?? err);
    }
  });
}
