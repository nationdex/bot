import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistRemove',
  // Removes a user or server from the blacklist. Returns removed or missing.
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
  $let[lock;$mutex[acquire;blacklist:$env[type]:$env[id]]]
  $if[$isBlacklisted[$env[type];$env[id]]==false;
    $!mutex[release;blacklist:$env[type]:$env[id];$get[lock]]
    $return[missing]
  ]
  $if[$env[type]==guild;$deleteGuildVar[blacklist;$env[id]];$deleteUserVar[blacklist;$env[id]]]
  $!blacklistHistoryPush[$env[type];$env[id];unblacklist;$env[moderator];$env[reason]]
  $!mutex[release;blacklist:$env[type]:$env[id];$get[lock]]
  $return[removed]
  `,
});
