import path from 'node:path';
import { cachedAnswer, invalidateData } from './data';
import { json } from './util';

export type BotRunner = (code: string) => Promise<string>;
let run: BotRunner = async () => {
  throw new Error('Bot connection unavailable');
};
export const useBotRunner = (runner: BotRunner): void => {
  run = runner;
};

// Values enter the interpreter through an encoded literal, never as executable DSL.
const value = (input: string): string => '$decodeURIComponent[' + encodeURIComponent(input) + ']';
const writes: ReadonlyArray<readonly [RegExp, string, string, number]> = [
  [new RegExp('^/nations/([^/]+)/delete$'), '$nationDelete[$get[id];$get[body]]', 'nations.delete', 65536],
  [new RegExp('^/users/([^/]+)/balance$'), '$userEdit[balance;$get[id];$get[body]]', 'users.balance', 65536],
  [new RegExp('^/categories$'), '$catalogEdit[categoryAdd;;$get[body]]', 'categories.add', 65536],
  [new RegExp('^/cards/add/regime$'), '$catalogEdit[cardAddRegime;;$get[body]]', 'cards.add.regime', 20971520],
  [new RegExp('^/cards/add/special$'), '$catalogEdit[cardAddSpecial;;$get[body]]', 'cards.add.special', 20971520],
  [new RegExp('^/nations$'), '$catalogEdit[nationAdd;;$get[body]]', 'nations.add', 65536],
  [new RegExp('^/users/([^/]+)/nations/give$'), '$userEdit[give;$get[id];$get[body]]', 'users.nations.give', 65536],
  [new RegExp('^/config/add$'), '$configEdit[add;$get[body]]', 'config.add', 65536],
  [new RegExp('^/cards/([^/]+)/edit$'), '$catalogEdit[cardEdit;$get[id];$get[body]]', 'cards.edit', 20971520],
  [new RegExp('^/users/([^/]+)/settings$'), '$userEdit[setting;$get[id];$get[body]]', 'users.settings', 65536],
  [
    new RegExp('^/cards/backgrounds/([^/]+)/replace$'),
    '$catalogEdit[backgroundReplace;$get[id];$get[body]]',
    'cards.backgrounds.replace',
    20971520,
  ],
  [new RegExp('^/config/delete$'), '$configEdit[delete;$get[body]]', 'config.delete', 65536],
  [
    new RegExp('^/cards/backgrounds/([^/]+)/delete$'),
    '$catalogEdit[backgroundDelete;$get[id]]',
    'cards.backgrounds.delete',
    65536,
  ],
  [
    new RegExp('^/users/([^/]+)/nations/edit$'),
    '$userEdit[editCatch;$get[id];$get[body]]',
    'users.nations.edit',
    65536,
  ],
  [new RegExp('^/nations/([^/]+)/art$'), '$catalogEdit[nationArt;$get[id];$get[body]]', 'nations.art', 20971520],
  [new RegExp('^/nations/([^/]+)$'), '$catalogEdit[nationEdit;$get[id];$get[body]]', 'nations.edit', 65536],
  [new RegExp('^/users/([^/]+)/stats$'), '$userEdit[stat;$get[id];$get[body]]', 'users.stats', 65536],
  [
    new RegExp('^/nations/([^/]+)/category$'),
    '$catalogEdit[nationCategory;$get[id];$get[body]]',
    'nations.category',
    65536,
  ],
  [new RegExp('^/config/reset$'), '$configEdit[reset;$get[body]]', 'config.reset', 65536],
  [new RegExp('^/users/([^/]+)/settings/reset$'), '$userEdit[settingsReset;$get[id]]', 'users.settings.reset', 65536],
  [new RegExp('^/cards/backgrounds$'), '$catalogEdit[backgroundAdd;;$get[body]]', 'cards.backgrounds.add', 20971520],
  [new RegExp('^/config$'), '$configEdit[set;$get[body]]', 'config.set', 65536],
  [
    new RegExp('^/users/([^/]+)/nations/remove$'),
    '$userEdit[removeCatch;$get[id];$get[body]]',
    'users.nations.remove',
    65536,
  ],
  [new RegExp('^/nations/([^/]+)/card$'), '$catalogEdit[nationCard;$get[id];$get[body]]', 'nations.card', 65536],
  [new RegExp('^/categories/([^/]+)/delete$'), '$catalogEdit[categoryDelete;$get[id]]', 'categories.delete', 65536],
  [new RegExp('^/guilds/([^/]+)/edit$'), '$guildEdit[$get[id];$get[body]]', 'guilds.edit', 65536],
  [new RegExp('^/users/([^/]+)/auction$'), '$userEdit[auction;$get[id];$get[body]]', 'users.auction', 65536],
];

function botPath(url: string): string {
  const rest = url.replace('/api/bot', '');
  if (rest === '/collectibles') return '/collectibles/data';
  if (rest.startsWith('/nation/cards/')) return '/nations/' + rest.slice('/nation/cards/'.length) + '/card';
  if (rest.startsWith('/nation/')) return '/nations/' + rest.slice('/nation/'.length);
  return rest;
}

export async function proxyCardImage(url: string): Promise<Response> {
  const raw = url.startsWith('/api/bot/cards/image/')
    ? url.slice('/api/bot/cards/image/'.length)
    : url.slice('/api/bot/cards/'.length, -'/image'.length);
  const id = raw.trim().replace(/\.(png|jpg|webp|svg)$/i, '');
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return json({ error: 'Card Not Found' }, 404);
  const cards = JSON.parse(await run('$cardList')) as { id: string }[];
  if (!cards.some((card) => String(card.id) === id)) return json({ error: 'Card Not Found' }, 404);
  const dir = await run('$jsonVar[config;paths.cards]');
  const file = Bun.file(path.resolve(dir.trim(), id + '.png'));
  if (!(await file.exists())) return json({ error: 'Card Not Found' }, 404);
  return new Response(file, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
}

async function read(url: string, search: string): Promise<unknown> {
  const query = new URLSearchParams(search);
  const id = query.get('id') ?? '';
  if (url === '/config') return JSON.parse(await run('$getGlobalVar[config]'));
  if (url === '/cards' || url === '/cards/backgrounds') return JSON.parse(await run('$cardList'));
  if (url === '/collectibles/data') {
    const data = JSON.parse(await run('$getGlobalVar[collectiblesData]'));
    if (!id) return data;
    if (!Object.prototype.hasOwnProperty.call(data.collectibles ?? {}, id)) throw new Error('Collectible Not Found');
    return data.collectibles[id];
  }
  const variable = /^\/search_db\/([^/]+)$/.exec(url);
  if (variable) return JSON.parse(await run('$searchDB[' + value(variable[1]) + ';' + value(id) + ']'));
  const user = url === '/user' ? id : /^\/users\/([^/]+)\/auction$/.exec(url)?.[1];
  if (user) {
    const get = async (name: string) =>
      JSON.parse((await run('$getUserVar[' + name + ';' + value(user) + ']')) || '{}');
    if (url !== '/user') return get('auction');
    return {
      collectiblesData: await get('userCollectibles'),
      auctionData: await get('auction'),
      settings: await get('settings'),
    };
  }
  const guild = /^\/guilds\/(\d{15,25})$/.exec(url);
  if (guild) {
    const cfg = JSON.parse((await run('$getGuildVar[spawnConfig;' + value(guild[1]) + ']')) || '{}');
    return {
      guild: guild[1],
      status: cfg.status ?? 'enabled',
      config_channel: cfg.config_channel ?? '',
      weight: cfg.weight ?? 0,
      timestamp: cfg.timestamp ?? '',
    };
  }
  throw new Error('Unknown panel operation');
}

// The caller authenticates the panel session and checks the exact method/path permission.
export async function proxyBot(req: Request, url: string, search: string, actor: string): Promise<Response> {
  const target = botPath(url);
  if (req.method === 'POST') {
    const operation = writes.find(([pattern]) => pattern.test(target));
    if (!operation) return json({ error: 'Not Found' }, 404);
    const [pattern, code, action, limit] = operation;
    const body = await req.text();
    if (body.length > limit) return json({ error: 'The request body is too large.' }, 413);
    if (body) {
      try {
        JSON.parse(body);
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }
    }
    const id = pattern.exec(target)?.[1] ?? '';
    const result = JSON.parse(await run('$let[id;' + value(id) + ']$let[body;' + value(body) + ']' + code));
    const status = Number(result.status);
    if (!Number.isInteger(status) || status < 100 || status > 599) throw new Error('Invalid bot response');
    if (status === 200) {
      invalidateData();
      await run('$accessLog[' + value(actor) + ';' + value('panel:' + action) + ';;' + value(id) + ']');
    }
    return json(
      { ...result, ok: status === 200, statusText: status === 200 ? 'OK' : (result.error ?? 'Error') },
      status,
    );
  }
  try {
    return await cachedAnswer(req, 'bot:' + target + search, 10_000, () => read(target, search), false);
  } catch {
    return json({ error: 'Bot data unavailable' }, 500);
  }
}
