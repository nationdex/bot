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
  $if[$and[$get[type]==guild;$get[id]==$homeGuild];$return[protected]]
  $let[lock;$mutex[acquire;blacklist:$get[type]:$get[id]]]
  $if[$isBlacklisted[$get[type];$get[id]];
    $!mutex[release;blacklist:$get[type]:$get[id];$get[lock]]
    $return[exists]
  ]
  $let[cleanReason;$if[$env[reason]!=null;$env[reason];]]
  $jsonLoad[entry;{}]
  $!jsonSet[entry;reason;$get[cleanReason]]
  $!jsonSet[entry;moderator;"$env[moderator]"]
  $!jsonSet[entry;timestamp;$getTimestamp]
  $if[$get[type]==guild;$setGuildVar[blacklist;$env[entry];$get[id]];$setUserVar[blacklist;$env[entry];$get[id]]]
  $!blacklistHistoryPush[$get[type];$get[id];blacklist;$env[moderator];$env[reason]]
  $!mutex[release;blacklist:$get[type]:$get[id];$get[lock]]
  $if[$get[type]==guild;$try[$!guildLeave[$get[id]];]]
  $return[added]
  `,
});
