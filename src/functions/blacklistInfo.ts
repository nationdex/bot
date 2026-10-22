import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistInfo',
  // Returns a blacklist entry as JSON, or one property of it; empty when not blacklisted.
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
    {
      name: 'property',
      // reason, moderator, timestamp or unix
      type: 'String',
      required: false,
    },
  ],
  code: `
  $if[$isBlacklisted[$env[type];$env[id]]==false;$return[]]
  $let[raw;$if[$env[type]==guild;$getGuildVar[blacklist;$env[id]];$getUserVar[blacklist;$env[id]]]]
  $return[$js[
    const e = JSON.parse(ctx.getKeyword('raw'));
    e.unix = Math.floor(e.timestamp / 1000);
    const p = String(ctx.getEnvironmentKey('property') || '').replace(/^null$/, '');
    p ? String(Reflect.get(e, p) ?? '') : JSON.stringify(e)
  ]]
  `,
});
