import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistAdd',
  // Blacklists a user or server. Returns added, exists or protected (yourself, the bot or staff).
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
      name: 'moderator',
      // The moderator id
      type: 'String',
      required: true,
    },
    {
      name: 'reason',
      // The reason
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[type;$env[type]]
  $let[id;$env[id]]
  $if[$and[$get[type]==user;$or[$get[id]==$env[moderator];$get[id]==$botID;$accessHasAny[$get[id]]]];$return[protected]]
  $if[$and[$get[type]==guild;$get[id]==$js[process.env.HOME_GUILD_ID || '']];$return[protected]]
  $if[$isBlacklisted[$get[type];$get[id]];$return[exists]]
  $let[entry;$js[JSON.stringify({ reason: String(ctx.getEnvironmentKey('reason') || '').replace(/^null$/, ''), moderator: ctx.getEnvironmentKey('moderator'), timestamp: Date.now() })]]
  $if[$get[type]==guild;$setGuildVar[blacklist;$get[entry];$get[id]];$setUserVar[blacklist;$get[entry];$get[id]]]
  $!blacklistHistoryPush[$get[type];$get[id];blacklist;$env[moderator];$env[reason]]
  $if[$get[type]==guild;$try[$!guildLeave[$get[id]];]]
  $return[added]
  `,
});
