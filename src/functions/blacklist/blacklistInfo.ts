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
  $jsonLoad[e;$get[raw]]
  $!jsonSet[e;unix;$floor[$divide[$env[e;timestamp];1000]]]
  $let[p;$replace[$env[property];null;]]
  $return[$if[$get[p]==;$env[e];$env[e;$get[p]]]]
  `,
});
