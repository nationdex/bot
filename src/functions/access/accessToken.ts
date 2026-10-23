import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessToken',
  // Creates an API token for the caller and returns ok:<token> once, or a status such as denied or limit.
  params: [
  ],
  code: `
  $let[actor;$authorID]
  $let[home;$js[process.env.HOME_GUILD_ID || '']]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $jsonLoad[caps;$accessCaps[$get[actor]]]
  $if[$arrayLength[caps]==0;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $let[token;ndx_$randomBytes[32]]
  $let[hash;$sha256[$get[token]]]
  $let[lock;$mutex[acquire;access]]
  $let[acc;$accessData]
  $let[held;$js[Object.values((JSON.parse(ctx.getKeyword('acc') || 'null') || {}).tokens || {}).filter((t) => t.user === ctx.getKeyword('actor')).length]]
  $if[$get[held]<3;
    $setGlobalVar[access;$js[
      const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
      acc.tokens = acc.tokens || {};
      Reflect.set(acc.tokens, ctx.getKeyword('hash'), { user: ctx.getKeyword('actor'), at: Date.now() });
      JSON.stringify(acc)
    ]]
  ]
  $!mutex[release;access;$get[lock]]
  $if[$get[held]>=3;$return[limit]]
  $!accessLog[$get[actor];token-create;$get[actor];]
  $return[ok:$get[token]]
  `,
});
