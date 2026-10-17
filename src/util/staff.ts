import { ArgType, Compiler, Interpreter, NativeFunction } from '@tryforge/forgescript';
import { inspect } from 'util';
import { createRequire } from 'module';
import { slashes as defaultSlashes } from '../config/slash';
import { variables as defaultVariables } from '../config/variables';

export type DeveloperRole = 'owner' | 'developer' | 'admin' | 'staff';

export interface DeveloperEntry {
  name?: string;
  role: DeveloperRole;
  permissions: string[];
  addedAt?: number;
}

// Hardcoded fallback developers
export const AUTHORIZED_DEV_IDS = new Set<string>([
  '525421785001361408', // Ariel Aram (PND26 Operator / Owner)
  '1421877908456083578', // Ayansh (Bot Developer)
  '903681538842054686', // Aditya (Web Developer)
  '910837428862984213',
]);

export const DEFAULT_ROLE_PERMISSIONS: Record<DeveloperRole, string[]> = {
  owner: ['*'],
  developer: ['eval', 'inspect', 'config'],
  admin: ['suggestions', 'blacklist', 'auction:moderate'],
  staff: ['suggestions', 'blacklist'],
};

export const DEFAULT_DEVS: Record<string, DeveloperEntry> = {
  '525421785001361408': {
    name: 'Ariel Aram',
    role: 'owner',
    permissions: ['*'],
  },
  '1421877908456083578': {
    name: 'Ayansh',
    role: 'developer',
    permissions: ['eval', 'inspect', 'config'],
  },
  '903681538842054686': {
    name: 'Aditya',
    role: 'developer',
    permissions: ['eval', 'inspect', 'config'],
  },
  '910837428862984213': {
    role: 'developer',
    permissions: ['eval', 'inspect', 'config'],
  },
};

let devCache: Record<string, DeveloperEntry> = { ...DEFAULT_DEVS };
let lastLoaded = 0;
const CACHE_TTL = 30_000;

/**
 * Load dynamic developer configurations from embedded PGlite store.
 */
export async function loadDevelopers(force = false): Promise<Record<string, DeveloperEntry>> {
  const now = Date.now();
  if (!force && now - lastLoaded < CACHE_TTL && Object.keys(devCache).length > 0) {
    return devCache;
  }
  try {
    const { DataBase } = require('@nationdex/db/dist/util');
    if (DataBase?.pg) {
      const row = await DataBase.get({ name: 'developers', type: 'custom' });
      if (row?.value) {
        const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        devCache = { ...DEFAULT_DEVS, ...parsed };
        for (const id of Object.keys(devCache)) {
          AUTHORIZED_DEV_IDS.add(id);
        }
        lastLoaded = now;
        return devCache;
      }
    }
  } catch {
    // If database unavailable, preserve fallback developers
  }
  devCache = { ...DEFAULT_DEVS };
  lastLoaded = now;
  return devCache;
}

/**
 * Save dynamic developers to the database.
 */
export async function saveDevelopers(devs: Record<string, DeveloperEntry>): Promise<void> {
  const { DataBase } = require('@nationdex/db/dist/util');
  if (DataBase?.pg) {
    await DataBase.set({
      name: 'developers',
      type: 'custom',
      value: JSON.stringify(devs),
    });
  }
  devCache = { ...DEFAULT_DEVS, ...devs };
  for (const id of Object.keys(devCache)) {
    AUTHORIZED_DEV_IDS.add(id);
  }
  lastLoaded = Date.now();
}

/**
 * Add or update developer entry in the dynamic registry.
 */
export async function setDeveloper(
  userId: string,
  entry: Partial<DeveloperEntry> & { role?: DeveloperRole }
): Promise<DeveloperEntry> {
  const current = await loadDevelopers(true);
  const role = entry.role ?? 'developer';
  const permissions = entry.permissions ?? DEFAULT_ROLE_PERMISSIONS[role] ?? ['eval'];
  const updated: DeveloperEntry = {
    ...current[userId],
    ...entry,
    role,
    permissions,
    addedAt: current[userId]?.addedAt ?? Date.now(),
  };
  current[userId] = updated;
  AUTHORIZED_DEV_IDS.add(userId);
  await saveDevelopers(current);
  return updated;
}

/**
 * Remove a developer from the dynamic registry.
 */
export async function removeDeveloper(userId: string): Promise<boolean> {
  const current = await loadDevelopers(true);
  if (!current[userId]) return false;
  delete current[userId];
  if (!DEFAULT_DEVS[userId]) {
    AUTHORIZED_DEV_IDS.delete(userId);
  }
  await saveDevelopers(current);
  return true;
}

/**
 * Check if a user is an authorized developer synchronously.
 */
export function isAuthorizedDevSync(userId: string | null | undefined, client?: any): boolean {
  if (!userId) return false;
  if (AUTHORIZED_DEV_IDS.has(userId)) return true;
  if (devCache[userId]) return true;

  const owner = client?.application?.owner;
  if (owner) {
    if (owner.id === userId) return true;
    if (typeof owner.members?.has === 'function' && owner.members.has(userId)) return true;
  }
  return false;
}

/**
 * Check if a user is an authorized developer asynchronously, fetching application data if needed.
 */
export async function isAuthorizedDev(userId: string | null | undefined, client?: any): Promise<boolean> {
  if (!userId) return false;
  if (isAuthorizedDevSync(userId, client)) return true;

  if (client?.application && !client.application.owner) {
    try {
      await client.application.fetch();
      if (isAuthorizedDevSync(userId, client)) return true;
    } catch {
      // Ignore network fetch errors
    }
  }

  await loadDevelopers();
  return isAuthorizedDevSync(userId, client);
}

/**
 * Check if a user has a specific granular developer permission synchronously.
 */
export function hasPermissionSync(
  userId: string | null | undefined,
  permission: string,
  client?: any
): boolean {
  if (!userId) return false;

  const owner = client?.application?.owner;
  if (owner) {
    if (owner.id === userId) return true;
    if (typeof owner.members?.has === 'function' && owner.members.has(userId)) return true;
  }

  const dev = devCache[userId] ?? DEFAULT_DEVS[userId];
  if (!dev) {
    if (AUTHORIZED_DEV_IDS.has(userId)) return true;
    return false;
  }

  if (dev.role === 'owner') return true;
  if (dev.permissions.includes('*')) return true;
  return dev.permissions.includes(permission);
}

/**
 * Check if a user has a specific granular developer permission asynchronously.
 */
export async function hasPermission(
  userId: string | null | undefined,
  permission: string,
  client?: any
): Promise<boolean> {
  if (!userId) return false;
  if (hasPermissionSync(userId, permission, client)) return true;

  if (client?.application && !client.application.owner) {
    try {
      await client.application.fetch();
      if (hasPermissionSync(userId, permission, client)) return true;
    } catch {
      // Ignore
    }
  }

  await loadDevelopers();
  return hasPermissionSync(userId, permission, client);
}

export const staffFunctions = [
  new NativeFunction({
    name: '$isBotDev',
    version: '1.0.0',
    description: 'Returns whether a user is an authorized bot developer',
    unwrap: true,
    brackets: true,
    output: ArgType.Boolean,
    args: [
      {
        name: 'user',
        description: 'The user ID',
        rest: false,
        required: true,
        type: ArgType.String,
      },
    ],
    async execute(ctx, [user]) {
      return this.success(await isAuthorizedDev(user, ctx.client));
    },
  }),

  new NativeFunction({
    name: '$hasDevPerm',
    version: '1.0.0',
    description: 'Returns whether a user has a specific granular developer permission',
    unwrap: true,
    brackets: true,
    output: ArgType.Boolean,
    args: [
      {
        name: 'user',
        description: 'The user ID',
        rest: false,
        required: true,
        type: ArgType.String,
      },
      {
        name: 'permission',
        description: 'The permission name (e.g. eval, inspect, config)',
        rest: false,
        required: true,
        type: ArgType.String,
      },
    ],
    async execute(ctx, [user, perm]) {
      return this.success(await hasPermission(user, perm, ctx.client));
    },
  }),

  new NativeFunction({
    name: '$evalPrefixCode',
    version: '1.0.0',
    description: 'Executes ForgeScript or JavaScript code from prefix command with granular permissions and replies with results',
    unwrap: false,
    brackets: false,
    args: [
      {
        name: 'code',
        description: 'Optional explicit code',
        rest: false,
        required: false,
        type: ArgType.String,
      },
    ],
    async execute(ctx) {
      const authorId = ctx.user?.id;
      if (!authorId) return this.stop();

      // 1. Granular permission check
      const authorized = await hasPermission(authorId, 'eval', ctx.client);
      if (!authorized) {
        return this.stop();
      }

      const message = ctx.message;
      if (!message) return this.stop();

      // 2. Extract code from raw message content
      let rawContent = '';
      const full = message.content || '';
      try {
        const prefix = await (ctx.client as any).getPrefix(message);
        let afterPrefix = full;
        if (prefix && full.startsWith(prefix)) {
          afterPrefix = full.slice(prefix.length).trim();
        }
        rawContent = afterPrefix.replace(/^(eval|ev)\b/i, '').trim();
      } catch {
        rawContent = (ctx.args || []).join(' ').trim();
      }

      if (!rawContent) {
        await message.reply('**Usage**: `n.eval <code>` or `n.eval js: <code>`');
        return this.success();
      }

      // 3. Strip markdown codeblocks if wrapped
      let code = rawContent;
      let isExplicitJs = false;
      if (code.startsWith('```') && code.endsWith('```')) {
        const match = code.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*)\n?```$/);
        if (match) {
          if (['js', 'javascript', 'ts', 'typescript'].includes((match[1] || '').toLowerCase())) {
            isExplicitJs = true;
          }
          code = match[2];
        } else {
          code = code.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
        }
      }

      const isJs = isExplicitJs || code.toLowerCase().startsWith('js:');
      const actualCode = isJs && code.toLowerCase().startsWith('js:') ? code.slice(3).trim() : code;

      const startTime = performance.now();

      try {
        let output: any;

        if (isJs) {
          let req: any = null;
          try {
            req = typeof require !== 'undefined' ? require : createRequire(__filename);
          } catch {
            // ignore
          }

          const channel = message.channel;
          const guild = message.guild;
          const user = message.author;
          const author = message.author;
          const member = message.member;

          const evalCtx = {
            client: ctx.client,
            message,
            channel,
            guild,
            user,
            author,
            member,
          };

          const slashes = defaultSlashes;
          const config = defaultVariables;
          let DataBase: any = null;
          try {
            DataBase = require('@nationdex/db/dist/util').DataBase;
          } catch {
            DataBase = (ctx.client as any)?.db?.DataBase ?? (ctx.client as any)?.db?.pg ?? null;
          }

          const staffModule = {
            AUTHORIZED_DEV_IDS,
            DEFAULT_DEVS,
            loadDevelopers,
            saveDevelopers,
            setDeveloper,
            removeDeveloper,
            isAuthorizedDev,
            hasPermission,
          };

          // Lexical & global scope
          if (req) (globalThis as any).require = req;
          (globalThis as any).ctx = evalCtx;
          (globalThis as any).client = ctx.client;
          (globalThis as any).message = message;
          (globalThis as any).channel = channel;
          (globalThis as any).guild = guild;
          (globalThis as any).user = user;
          (globalThis as any).author = author;
          (globalThis as any).member = member;
          (globalThis as any).slashes = slashes;
          (globalThis as any).config = config;
          (globalThis as any).DataBase = DataBase;
          (globalThis as any).staff = staffModule;

          void [req, evalCtx, channel, guild, user, author, member, slashes, config, DataBase, staffModule];

          try {
            output = await eval(actualCode);
          } catch (e: any) {
            if (e instanceof SyntaxError && /await|return/.test(e.message)) {
              output = await eval(`(async () => {\n${actualCode}\n})()`);
            } else {
              throw e;
            }
          }

          if (typeof output !== 'string') {
            output = inspect(output, { depth: 2, maxArrayLength: 50 });
          }
        } else {
          // ForgeScript evaluation
          const res = await Interpreter.run({
            ...ctx.cloneRuntime(),
            client: ctx.client,
            obj: message,
            command: null,
            data: Compiler.compile(actualCode),
            doNotSend: true,
          });
          output = res === null || res === undefined ? '' : String(res);
        }

        const elapsed = (performance.now() - startTime).toFixed(2);
        const displayOutput = output === '' ? '[No output / return value]' : String(output);

        if (displayOutput.length > 1900) {
          const buffer = Buffer.from(displayOutput, 'utf-8');
          await message.reply({
            content: `**Eval Result** (\`${elapsed}ms\`):\nOutput exceeded 2,000 characters, sent as file.`,
            files: [{ attachment: buffer, name: 'eval_result.txt' }],
          });
        } else {
          await message.reply({
            content: `**Eval Result** (\`${elapsed}ms\`):\n\`\`\`${isJs ? 'js' : ''}\n${displayOutput}\n\`\`\``,
          });
        }
      } catch (err: any) {
        const elapsed = (performance.now() - startTime).toFixed(2);
        const errMsg = err?.message || String(err);
        await message.reply({
          content: `**Eval Error** (\`${elapsed}ms\`):\n\`\`\`\n${errMsg.slice(0, 1900)}\n\`\`\``,
        });
      }

      return this.success();
    },
  }),
];
