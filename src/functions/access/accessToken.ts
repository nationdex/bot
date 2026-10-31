import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessToken',
  // Creates an API token for the caller and returns ok:<token> once, or a status such as denied or limit.
  params: [
  ],
  code: `
  $let[actor;$authorID]
  $let[home;$homeGuild]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $jsonLoad[caps;$accessCaps[$get[actor]]]
  $if[$arrayLength[caps]==0;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $let[token;ndx_$randomBytes[32]]
  $let[hash;$sha256[$get[token]]]
  $let[lock;$mutex[acquire;access]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[toks;$if[$jsonHas[acc;tokens];$env[acc;tokens];{}]]
  $jsonLoad[tokValues;$jsonValues[toks]]
  $arrayFilter[tokValues;t;$env[t;user]==$get[actor];userToks]
  $let[held;$arrayLength[userToks]]
  $if[$get[held]<3;
    $!jsonSet[acc;tokens;$get[hash];user;$get[actor]]
    $!jsonSet[acc;tokens;$get[hash];at;$getTimestamp]
    $setGlobalVar[access;$env[acc]]
  ]
  $!mutex[release;access;$get[lock]]
  $if[$get[held]>=3;$return[limit]]
  $!accessLog[$get[actor];token-create;$get[actor];]
  $return[ok:$get[token]]
  `,
});
