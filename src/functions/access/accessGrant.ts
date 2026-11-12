import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessGrant',
  // Grants a role or capability to a user for the current staff member. Returns a status such as ok, denied, owner_only or unknown.
  params: [
    {
      name: 'target',
      // The user id
      type: 'String',
      required: true,
    },
    {
      name: 'subject',
      // A role name or capability
      type: 'String',
      required: true,
    },
    {
      name: 'hours',
      // Hours until the grant expires, 0 or empty for never
      type: 'String',
      required: false,
    },
    {
      name: 'reason',
      // Why
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[actor;$authorID]
  $let[target;$env[target]]
  $let[subj;$trim[$env[subject]]]
  $if[$hasCap[$get[actor];access.manage]==false;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $if[$userExists[$get[target]]==false;$return[invalid]]
  $if[$get[target]==$get[actor];$return[self]]
  $if[$isBot[$get[target]];$return[bot]]
  $let[sub;$trim[$accessSubject[$get[subj]]]]
  $if[$get[sub]==;$return[unknown]]
  $jsonLoad[subObj;$get[sub]]
  $let[needed;$env[subObj;caps]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[needed]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]
  $if[$and[$accessMatch[$get[needed];*];$replace[$env[hours];null;]!=;$replace[$env[hours];null;]!=0];$return[owner_expiry]]

  $let[h;$if[$isNumber[$env[hours]];$env[hours];0]]
  $let[expires;$if[$get[h]>0;$sum[$getTimestamp;$multi[$get[h];3600000]];0]]
  $let[lock;$mutex[acquire;ua:$get[target]]]
  $jsonLoad[ua;$getUserVar[userAccess;$get[target]]]
  $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
  $if[$isArray[$env[grants]];
    $arrayFilter[grants;g;$env[g;subject]!=$get[subj];filteredGrants]
  ;
    $arrayCreate[filteredGrants]
  ]
  $jsonLoad[newGrant;{}]
  $!jsonSet[newGrant;subject;$get[subj]]
  $!jsonSet[newGrant;kind;$env[subObj;kind]]
  $!jsonSet[newGrant;expires;$get[expires]]
  $!jsonSet[newGrant;by;"$get[actor]"]
  $!jsonSet[newGrant;at;$getTimestamp]
  $!jsonSet[newGrant;reason;$cropText[$if[$env[reason]!=null;$env[reason];];0;200]]
  $!arrayPushJSON[filteredGrants;$env[newGrant]]
  $!jsonSet[ua;grants;$env[filteredGrants]]
  $setUserVar[userAccess;$env[ua];$get[target]]
  $!mutex[release;ua:$get[target];$get[lock]]
  $!accessLog[$get[actor];grant;$get[target];$get[subj]]
  $if[$accessSensitive[$get[needed]];
    $!accessNotify[Access granted: \`$fetchUsername[$get[actor]]\` gave \`$get[subj]\` to \`$fetchUsername[$get[target]]\`$if[$get[expires]!=0; until <t:$floor[$divide[$get[expires];1000]]:f>].]
  ]
  $return[ok]
  `,
});
