import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessToken',
  // Creates an API token only for the Discord application owner. Returns ok:<token> once.
  params: [
  ],
  code: `
  $let[actor;$authorID]
  $let[home;$homeGuild]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $jsonLoad[caps;$accessCaps[$get[actor]]]
  $if[$arrayIncludes[caps;*]==false;$return[owner_only]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $let[token;ndx_$randomBytes[32]]
  $let[hash;$sha256[$get[token]]]
  $let[lock;$mutex[acquire;access]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[toks;$if[$jsonHas[acc;tokens];$env[acc;tokens];{}]]
  $jsonLoad[hashes;$jsonKeys[toks]]
  $let[held;0]
  $arrayForEach[hashes;h;$if[$env[toks;$env[h];user]==$get[actor];$letSum[held;1]]]
  $if[$get[held]<3;
    $!jsonSet[acc;tokens;$get[hash];{"user":"$get[actor]","at":$getTimestamp}]
    $setGlobalVar[access;$env[acc]]
  ]
  $!mutex[release;access;$get[lock]]
  $if[$get[held]>=3;$return[limit]]
  $!accessLog[$get[actor];token-create;$get[actor];]
  $return[ok:$get[token]]
  `,
});
