import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { createHash } from 'crypto';
import { DataBase } from '@nationdex/db/dist/util';
import { audit, can, homeGuildId } from './access';
import * as data from './staffData';

// Business logic behind the POST routes in src/api_routes/v1/POST. The routes themselves are @nationdex/api
// RouteDefinitions written in ForgeScript; these functions authenticate the bearer token and run one edit.
// Every operation re-checks the caller's capability, so a route can never skip authorization.

const SNOWFLAKE = /^\d{15,25}$/;
const MAX_BODY = 64 * 1024;
const MAX_UPLOAD = 15 * 1024 * 1024;

const pg = () => (DataBase as any).pg;
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

type Body = Record<string, any>;
interface Reply {
  ok: boolean;
  status: number;
  statusText: string;
  error?: string;
  value?: unknown;
}

const TEXT: Record<number, string> = { 200: 'OK', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 413: 'Payload Too Large', 500: 'Internal Server Error' };
const reply = (status: number, error?: string, value?: unknown): Reply => ({
  ok: status === 200,
  status,
  statusText: TEXT[status] ?? 'Error',
  ...(error ? { error } : {}),
  ...(value !== undefined ? { value } : {}),
});
const fromResult = (r: data.Result): Reply => (r.ok ? reply(200, undefined, r.value) : reply(400, r.error));

function parseBody(raw: string, max = MAX_BODY): Body | Reply {
  if (raw.length > max) return reply(413, 'The request body is too large.');
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : reply(400, 'The body must be a JSON object.');
  } catch {
    return reply(400, 'The body is not valid JSON.');
  }
}
const isReply = (v: Body | Reply): v is Reply => typeof (v as Reply).status === 'number' && 'ok' in v && 'statusText' in v;
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

async function realUser(client: any, id: string): Promise<boolean> {
  if (!SNOWFLAKE.test(id)) return false;
  return !!(await client.users.fetch(id).catch(() => null));
}

interface Op {
  name: string;
  cap: string;
  args: string[]; // names of the URL/body arguments after the actor
  upload?: boolean;
  run: (client: any, actor: string, a: string[], body: Body) => Promise<Reply>;
}

const NATION_KEYS = Object.values(data.NATION_GROUPS).flatMap((g) => g.fields.map((f) => f.key));
const root = (v: unknown): data.ConfigRoot | null => (v === 'config' || v === 'keywords' ? v : null);

const OPS: Op[] = [
  {
    name: 'nationAdd', cap: 'nations.edit', args: [],
    run: async (_c, _u, _a, b) => {
      const r = await data.addNation({ name: str(b.name), class: str(b.class), attack: str(b.attack), health: str(b.health), rarity: str(b.rarity ?? 10), emoji_id: str(b.emoji_id) });
      return r.ok ? reply(200, undefined, { id: r.value }) : reply(400, r.error);
    },
  },
  {
    name: 'nationEdit', cap: 'nations.edit', args: ['id'],
    run: async (_c, _u, [id], b) => {
      const patch: Record<string, string> = {};
      for (const key of NATION_KEYS) if (key in b) patch[key] = Array.isArray(b[key]) ? b[key].join(', ') : str(b[key]);
      if (!Object.keys(patch).length) return reply(400, `Send at least one of: ${NATION_KEYS.join(', ')}.`);
      return fromResult(await data.editNation(id, patch));
    },
  },
  { name: 'nationDelete', cap: 'nations.edit', args: ['id'], run: async (_c, _u, [id], b) => fromResult(await data.deleteNation(id, b.cascade === true)) },
  { name: 'nationCategory', cap: 'nations.edit', args: ['id'], run: async (_c, _u, [id], b) => fromResult(await data.setNationClass(id, str(b.class))) },
  {
    name: 'nationCard', cap: 'cards.edit', args: ['id'],
    run: async (_c, _u, [id], b) => {
      if (b.regime === undefined && b.economy === undefined) return reply(400, 'Send regime (card background) and/or economy (icon).');
      for (const key of ['regime', 'economy'] as const) {
        if (b[key] === undefined) continue;
        const r = await data.setNationAsset(id, key, str(b[key]));
        if (!r.ok) return reply(400, r.error);
      }
      return reply(200);
    },
  },
  { name: 'categoryAdd', cap: 'cards.edit', args: [], run: async (_c, _u, _a, b) => fromResult(await data.addClass(str(b.name))) },
  { name: 'categoryDelete', cap: 'cards.edit', args: ['name'], run: async (_c, _u, [name]) => fromResult(await data.deleteClass(name)) },
  {
    name: 'backgroundAdd', cap: 'cards.edit', args: [], upload: true,
    run: async (_c, _u, _a, b) => {
      if (typeof b.data !== 'string' || !b.data) return reply(400, 'Send data as a base64 encoded PNG.');
      return fromResult(await data.addCardBackground(str(b.name), Buffer.from(b.data, 'base64')));
    },
  },
  { name: 'backgroundDelete', cap: 'cards.edit', args: ['name'], run: async (_c, _u, [name]) => fromResult(await data.deleteCardBackground(name)) },
  {
    name: 'userBalance', cap: 'users.edit', args: ['user'],
    run: async (c, _u, [user], b) => {
      if (!(await realUser(c, user))) return reply(404, 'No such Discord user.');
      const mode = str(b.mode);
      if (mode !== 'set' && mode !== 'add' && mode !== 'remove') return reply(400, 'mode must be set, add or remove.');
      return fromResult(await data.editBalance(user, mode, str(b.amount)));
    },
  },
  {
    name: 'userSetting', cap: 'users.edit', args: ['user'],
    run: async (c, _u, [user], b) => ((await realUser(c, user)) ? fromResult(await data.setUserSetting(user, str(b.key), str(b.value))) : reply(404, 'No such Discord user.')),
  },
  {
    name: 'userSettingsReset', cap: 'users.edit', args: ['user'],
    run: async (c, _u, [user]) => ((await realUser(c, user)) ? fromResult(await data.resetUserSettings(user)) : reply(404, 'No such Discord user.')),
  },
  {
    name: 'userStat', cap: 'users.edit', args: ['user'],
    run: async (c, _u, [user], b) => ((await realUser(c, user)) ? fromResult(await data.setUserStat(user, str(b.key), str(b.value))) : reply(404, 'No such Discord user.')),
  },
  {
    name: 'userGive', cap: 'users.edit', args: ['user'],
    run: async (c, _u, [user], b) => ((await realUser(c, user)) ? fromResult(await data.giveNation(user, str(b.nation), Number(b.count ?? 1))) : reply(404, 'No such Discord user.')),
  },
  {
    name: 'userRemoveCatch', cap: 'users.edit', args: ['user'],
    run: async (c, _u, [user], b) => ((await realUser(c, user)) ? fromResult(await data.removeCatch(user, str(b.catch))) : reply(404, 'No such Discord user.')),
  },
  {
    name: 'configSet', cap: 'config.edit', args: [],
    run: async (_c, _u, _a, b) => {
      const r = root(b.root);
      return r ? fromResult(await data.setConfigValue(r, str(b.path), str(b.value))) : reply(400, 'root must be config or keywords.');
    },
  },
  {
    name: 'configAdd', cap: 'config.edit', args: [],
    run: async (_c, _u, _a, b) => {
      const r = root(b.root);
      return r ? fromResult(await data.addConfigKey(r, str(b.parent), str(b.key), str(b.value))) : reply(400, 'root must be config or keywords.');
    },
  },
  {
    name: 'configDelete', cap: 'config.edit', args: [],
    run: async (_c, _u, _a, b) => {
      const r = root(b.root);
      return r ? fromResult(await data.deleteConfigKey(r, str(b.path))) : reply(400, 'root must be config or keywords.');
    },
  },
  {
    name: 'configReset', cap: 'config.edit', args: [],
    run: async (_c, _u, _a, b) => {
      const r = root(b.root);
      return r ? fromResult(await data.resetConfigKey(r, str(b.path))) : reply(400, 'root must be config or keywords.');
    },
  },
];

const AUDIT_DETAIL = (op: Op, a: string[], b: Body) => {
  const copy = { ...b };
  if ('data' in copy) copy.data = '(file)';
  return `${a.join(' ')} ${JSON.stringify(copy)}`.trim().slice(0, 300);
};

async function execute(client: any, op: Op, actor: string, a: string[], raw: string): Promise<Reply> {
  if (!actor) return reply(401, 'Missing or invalid API token.');
  if (!(await can(actor, op.cap, { guildId: homeGuildId() }))) return reply(403, `Your account lacks the ${op.cap} capability.`);
  const body = parseBody(raw, op.upload ? MAX_UPLOAD : MAX_BODY);
  if (isReply(body)) return body;
  try {
    const out = await op.run(client, actor, a, body);
    if (out.ok) await audit(actor, `api:${op.name}`, null, AUDIT_DETAIL(op, a, body)).catch(() => undefined);
    return out;
  } catch (err: any) {
    console.warn(`[WARN] [api] ${op.name} failed:`, err?.message ?? err);
    return reply(500, 'Something went wrong.');
  }
}

export const apiAdminFunctions = [
  new NativeFunction({
    name: '$apiAuth',
    version: '1.0.0',
    description: 'Resolves the Authorization header (Bearer token) of an API request to a user id, or empty when invalid',
    unwrap: true,
    brackets: true,
    args: [{ name: 'header', description: 'The Authorization header', rest: false, required: false, type: ArgType.String }],
    async execute(_ctx, [header]) {
      const m = /^Bearer\s+(ndx_[0-9a-f]{64})$/i.exec(String(header ?? '').trim());
      if (!m || !pg()) return this.success('');
      const res = await pg().query('SELECT user_id FROM access_token WHERE hash = $1', [hashToken(m[1].toLowerCase())]);
      return this.success(res.rows[0]?.user_id ?? '');
    },
  }),
  ...OPS.map(
    (op) =>
      new NativeFunction({
        name: `$api${op.name.charAt(0).toUpperCase()}${op.name.slice(1)}`,
        version: '1.0.0',
        description: `API operation ${op.name}. Needs ${op.cap}. Returns {ok,status,statusText,error,value} as JSON`,
        unwrap: true,
        brackets: true,
        args: [
          { name: 'actor', description: 'The authenticated user id from $apiAuth', rest: false, required: false, type: ArgType.String },
          ...op.args.map((name) => ({ name, description: `The ${name}`, rest: false, required: true, type: ArgType.String }) as const),
          { name: 'body', description: 'The raw JSON request body', rest: false, required: false, type: ArgType.String },
        ],
        async execute(ctx, args) {
          const actor = String(args[0] ?? '').replace(/^null$/, '');
          const params = args.slice(1, 1 + op.args.length).map((v) => String(v ?? ''));
          const raw = String(args[1 + op.args.length] ?? '').replace(/^null$/, '');
          return this.success(JSON.stringify(await execute(ctx.client, op, actor, params, raw)));
        },
      }),
  ),
];

export const apiOperations = OPS.map((o) => ({ name: o.name, cap: o.cap, args: o.args }));
