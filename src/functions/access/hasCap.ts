import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'hasCap',
  // Returns whether a user holds a staff capability. Staff capabilities only work in the home server (HOME_GUILD_ID).
  params: [
    {
      name: 'user',
      // The user id
      type: 'String',
      required: true,
    },
    {
      name: 'capability',
      // The capability, e.g. blacklist.write
      type: 'String',
      required: true,
    },
    {
      name: 'scope',
      // Empty for the current server, home for the API, dm to allow direct messages
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[user;$env[user]]
  $let[scope;$replace[$env[scope];null;]]
  $let[home;$homeGuild]
  $let[valid;$js[ctx.getKeyword('user').length > 14 && ctx.getKeyword('user').length < 26 && ctx.getKeyword('user').split('').every((c) => c >= '0' && c <= '9')]]
  $if[$or[$get[home]==;$get[valid]==false];$return[false]]
  $let[where;$if[$get[scope]==home;$get[home];$if[$get[scope]==dm;dm;$guildID]]]
  $if[$and[$get[where]!=$get[home];$get[where]!=dm];$return[false]]
  $if[$isBlacklisted[user;$get[user]];$return[false]]
  $return[$accessMatch[$accessCaps[$get[user]];$env[capability]]]
  `,
});
