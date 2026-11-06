import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessRevoke',
  // Revokes a role or capability from a user. Returns a status such as ok, missing, last_owner or owner_only.
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
  ],
  code: `
  $let[actor;$authorID]
  $let[target;$env[target]]
  $let[subj;$trim[$env[subject]]]
  $if[$hasCap[$get[actor];access.manage]==false;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $if[$userExists[$get[target]]==false;$return[invalid]]
  $jsonLoad[ua;$getUserVar[userAccess;$get[target]]]
  $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
  $let[has;$and[$isArray[$env[grants]];$arraySome[grants;g;$env[g;subject]==$get[subj]]]]
  $if[$get[has]==false;$return[missing]]
  $let[sub;$trim[$accessSubject[$get[subj]]]]
  $jsonLoad[subObj;$if[$get[sub]!=;$get[sub];{}]]
  $arrayCreate[emptyCaps]
  $let[needed;$if[$jsonHas[subObj;caps];$env[subObj;caps];$jsonStringify[emptyCaps]]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[needed]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]
  $jsonLoad[neededArr;$get[needed]]
  $jsonLoad[ownersArr;$accessOwners]
  $arrayFilter[ownersArr;id;$env[id]!=$get[target];otherOwners]
  $let[lastOwner;$and[$isArray[$env[neededArr]];$arrayIncludes[neededArr;*];$arrayLength[otherOwners]==0]]
  $if[$get[lastOwner];$return[last_owner]]
  $let[lock;$mutex[acquire;ua:$get[target]]]
  $jsonLoad[ua;$getUserVar[userAccess;$get[target]]]
  $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
  $if[$isArray[$env[grants]];
    $arrayFilter[grants;g;$env[g;subject]!=$get[subj];filteredGrants]
    $!jsonSet[ua;grants;$env[filteredGrants]]
    $setUserVar[userAccess;$env[ua];$get[target]]
  ]
  $!mutex[release;ua:$get[target];$get[lock]]
  $!accessLog[$get[actor];revoke;$get[target];$get[subj]]
  $if[$accessSensitive[$get[needed]];
    $!accessNotify[Access revoked: \`$fetchUsername[$get[actor]]\` removed \`$get[subj]\` from \`$fetchUsername[$get[target]]\`.]
  ]
  $return[ok]
  `,
});
