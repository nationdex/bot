import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessTokenRevoke',
  // Revokes every API token of a user (the caller when empty). Returns a status.
  params: [
    {
      name: 'user',
      // The user id, or empty for yourself
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[actor;$authorID]
  $let[target;$replace[$env[user];null;]]
  $if[$get[target]==;$let[target;$get[actor]]]
  $let[home;$homeGuild]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $if[$and[$get[target]!=$get[actor];$hasCap[$get[actor];access.manage]==false];$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $if[$userExists[$get[target]]==false;$return[invalid]]
  $let[lock;$mutex[acquire;access]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[toks;$if[$jsonHas[acc;tokens];$env[acc;tokens];{}]]
  $jsonLoad[tokKeys;$jsonKeys[toks]]
  $let[removed;0]
  $arrayForEach[tokKeys;h;
    $if[$env[toks;$env[h];user]==$get[target];
      $!jsonDelete[toks;$env[h]]
      $let[removed;$sum[$get[removed];1]]
    ]
  ]
  $if[$get[removed]>0;
    $!jsonSet[acc;tokens;$env[toks]]
    $setGlobalVar[access;$env[acc]]
  ]
  $!mutex[release;access;$get[lock]]
  $if[$get[removed]==0;$return[missing]]
  $!accessLog[$get[actor];token-revoke;$get[target];$get[removed] token(s)]
  $return[ok]
  `,
});
