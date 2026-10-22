import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistGuard',
  // Stops the command when the author or server is blacklisted (staff are exempt). Reply mode sends the notice first.
  params: [
    {
      name: 'mode',
      // silent or reply
      type: 'String',
      required: false,
    },
  ],
  brackets: false,
  code: `
  $let[reason;$if[$isBlacklisted[user;$authorID];blacklisted_user;$if[$isBlacklisted[guild;$guildID];blacklisted_guild;]]]
  $if[$get[reason]==;$return[]]
  $if[$accessHasAny[$authorID];$return[]]
  $if[$replace[$env[mode];null;]==reply;$!err[$get[reason];true]]
  $stop
  `,
});
