import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistEntry',
  // Returns the detail of one target as JSON: blacklisted, title, status (bullets) and history (bullets, newest first).
  params: [
    {
      name: 'type',
      // user or guild
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The user or guild id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[type;$if[$env[type]==guild;guild;user]]
  $let[raw;$if[$get[type]==guild;$getGuildVar[blacklist;$env[id]];$getUserVar[blacklist;$env[id]]]]
  $let[hist;$if[$get[type]==guild;$getGuildVar[blacklistHistory;$env[id]];$getUserVar[blacklistHistory;$env[id]]]]
  $return[$js[(async () => {
    const type = ctx.getKeyword('type');
    const id = String(ctx.getEnvironmentKey('id'));
    const e = JSON.parse(ctx.getKeyword('raw') || 'null') || {};
    const entry = Number(e.timestamp) > 0 ? e : null;
    const history = JSON.parse(ctx.getKeyword('hist') || 'null') || new Array();
    const nl = String.fromCharCode(10);
    const tick = String.fromCharCode(96);
    const code = (v) => tick + v + tick;
    const unix = (ms) => Math.floor(ms / 1000);
    const oneLine = (text, max) => {
      const flat = String(text || 'None').split(String.fromCharCode(10)).join(' ').split(' ').filter((p) => p.length).join(' ') || 'None';
      return flat.length > max ? flat.slice(0, max - 3) + '...' : flat;
    };
    const name = async (uid) => {
      const u = await ctx.client.users.fetch(uid).catch(() => null);
      return u && u.username ? u.username : 'unknown';
    };
    const guildName = type === 'guild' ? (ctx.client.guilds.cache.get(id)?.name ?? '') : '';
    const label = type === 'user' ? code(await name(id)) + ' (' + code(id) + ')' : (guildName ? '**' + oneLine(guildName, 60) + '** (' + code(id) + ')' : 'Server ' + code(id));
    const status = entry
      ? '- **Status:** Blacklisted' + nl + '- **Reason:** ' + oneLine(entry.reason, 300) + nl + '- **Moderator:** ' + code(await name(entry.moderator)) + ' (' + code(entry.moderator) + ')' + nl + '- **Since:** <t:' + unix(entry.timestamp) + ':f> (<t:' + unix(entry.timestamp) + ':R>)'
      : '- **Status:** Not blacklisted';
    const recent = await Promise.all(history.slice(0, 10).map(async (h) => '- **' + (h.action === 'blacklist' ? 'Blacklisted' : 'Removed') + '** · <t:' + unix(h.timestamp) + ':R> · by ' + code(await name(h.moderator)) + ' · ' + oneLine(h.reason, 120)));
    if (history.length > 10) recent.push('-# ...and ' + (history.length - 10) + ' older entries');
    return JSON.stringify({ type: type, id: id, blacklisted: !!entry, title: '## Blacklist: ' + label, status: status, history: recent.length ? recent.join(nl) : '- No history' });
  })()]]
  `,
});
