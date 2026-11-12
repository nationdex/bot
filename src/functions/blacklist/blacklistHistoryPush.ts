import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistHistoryPush',
  // Adds an entry to the blacklist history of a target (newest first, capped at 100).
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
      name: 'action',
      // blacklist or unblacklist
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
  $let[raw;$if[$env[type]==guild;$getGuildVar[blacklistHistory;$env[id]];$getUserVar[blacklistHistory;$env[id]]]]
  $jsonLoad[list;$if[$get[raw]!=;$get[raw];{}]]
  $if[$isArray[$env[list]]==false;$arrayCreate[list]]
  $let[cleanReason;$if[$env[reason]!=null;$env[reason];]]
  $jsonLoad[entry;{}]
  $!jsonSet[entry;action;$env[action]]
  $!jsonSet[entry;moderator;"$env[moderator]"]
  $!jsonSet[entry;reason;$get[cleanReason]]
  $!jsonSet[entry;timestamp;$getTimestamp]
  $!arrayUnshiftJSON[list;$env[entry]]
  $if[$arrayLength[list]>100;
    $!arraySlice[list;list;0;100]
  ]
  $if[$env[type]==guild;$setGuildVar[blacklistHistory;$env[list];$env[id]];$setUserVar[blacklistHistory;$env[list];$env[id]]]
  `,
});
