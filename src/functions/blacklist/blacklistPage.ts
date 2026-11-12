import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistPage',
  // Returns one page of the blacklist as JSON: type, page, pages, total, body (bullet lines) and items (id, line, label, description).
  params: [
    {
      name: 'type',
      // user or guild
      type: 'String',
      required: true,
    },
    {
      name: 'page',
      // The page number
      type: 'String',
      required: true,
    },
    {
      name: 'size',
      // Entries per page
      type: 'String',
      required: false,
    },
  ],
  code: `
  $jsonLoad[rows;$searchDB[blacklist]]
  $return[$js[(async () => {
    const type = ctx.getEnvironmentKey('type') === 'guild' ? 'guild' : 'user';
    const size = parseInt(String(ctx.getEnvironmentKey('size')), 10) || 10;
    const entries = ctx.getEnvironmentKey('rows').filter((r) => r.type === type).map((r) => Object.assign({ id: r.id }, JSON.parse(r.value || 'null') || {})).filter((e) => Number(e.timestamp) > 0).sort((a, b) => b.timestamp - a.timestamp);
    const pages = Math.max(1, Math.ceil(entries.length / size));
    const page = Math.min(Math.max(1, Math.floor(Number(ctx.getEnvironmentKey('page'))) || 1), pages);
    const nl = String.fromCharCode(10);
    const tick = String.fromCharCode(96);
    const code = (v) => tick + v + tick;
    const oneLine = (text, max) => {
      const flat = String(text || 'None').split(String.fromCharCode(10)).join(' ').split(' ').filter((p) => p.length).join(' ') || 'None';
      return flat.length > max ? flat.slice(0, max - 3) + '...' : flat;
    };
    const name = async (id) => {
      const u = await ctx.client.users.fetch(id).catch(() => null);
      return u && u.username ? u.username : 'unknown';
    };
    const items = await Promise.all(entries.slice((page - 1) * size, page * size).map(async (e) => {
      const target = type === 'user' ? await name(e.id) : '';
      const label = type === 'user' ? target : (ctx.client.guilds.cache.get(e.id)?.name ?? '');
      const subject = type === 'user' ? code(target) : code(e.id);
      return {
        id: e.id,
        line: '- ' + subject + (type === 'guild' && label ? ' ' + oneLine(label, 40) : '') + ' · ' + oneLine(e.reason, 80) + ' · by ' + code(await name(e.moderator)) + ' · <t:' + Math.floor(e.timestamp / 1000) + ':R>',
        label: oneLine(label || e.id, 100),
        description: oneLine((label ? e.id + ' · ' : '') + (e.reason || 'None'), 100),
      };
    }));
    const body = items.length ? items.map((i) => i.line).join(nl) : '- No blacklisted ' + (type === 'user' ? 'users' : 'servers') + '.';
    return JSON.stringify({ type: type, page: page, pages: pages, total: entries.length, body: body, items: items });
  })()]]
  `,
});
