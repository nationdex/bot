import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessClaim',
  // Claims ownership for the verified Discord application owner while no owner exists. Returns a status.
  params: [
  ],
  code: `
  $let[actor;$authorID]
  $let[home;$homeGuild]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $let[lock;$mutex[acquire;claim]]
  $jsonLoad[owners;$accessOwners]
  $let[state;$if[$arrayLength[owners]>0;claimed;$if[$botOwnerID==$get[actor];ok;not_app_owner]]]
  $if[$get[state]==ok;
    $let[uaLock;$mutex[acquire;ua:$get[actor]]]
    $jsonLoad[ua;$getUserVar[userAccess;$get[actor]]]
    $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
    $if[$isArray[grants];
      $arrayFilter[grants;g;$env[g;subject]!=owner;filteredGrants]
    ;
      $arrayCreate[filteredGrants]
    ]
    $jsonLoad[claimGrant;{}]
    $!jsonSet[claimGrant;subject;owner]
    $!jsonSet[claimGrant;kind;role]
    $!jsonSet[claimGrant;expires;0]
    $!jsonSet[claimGrant;by;$get[actor]]
    $!jsonSet[claimGrant;at;$getTimestamp]
    $!jsonSet[claimGrant;reason;claimed as application owner]
    $!arrayPushJSON[filteredGrants;$env[claimGrant]]
    $!jsonSet[ua;grants;$env[filteredGrants]]
    $setUserVar[userAccess;$env[ua];$get[actor]]
    $!mutex[release;ua:$get[actor];$get[uaLock]]
  ]
  $!mutex[release;claim;$get[lock]]
  $if[$get[state]==ok;$!accessLog[$get[actor];claim;$get[actor];application owner]]
  $if[$get[state]==not_app_owner;$!accessLog[$get[actor];claim-denied;;not the application owner]]
  $return[$get[state]]
  `,
});
