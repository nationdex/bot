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
  $let[home;$js[process.env.HOME_GUILD_ID || '']]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $if[$and[$get[target]!=$get[actor];$hasCap[$get[actor];access.manage]==false];$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $if[$userExists[$get[target]]==false;$return[invalid]]
  $let[lock;$mutex[acquire;access]]
  $let[acc;$getGlobalVar[access]]
  $let[removed;$js[Object.values((JSON.parse(ctx.getKeyword('acc') || 'null') || {}).tokens || {}).filter((t) => t.user === ctx.getKeyword('target')).length]]
  $if[$get[removed]>0;
    $setGlobalVar[access;$js[
      const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
      const tokens = acc.tokens || {};
      Object.keys(tokens).forEach((h) => { if (Reflect.get(tokens, h).user === ctx.getKeyword('target')) Reflect.deleteProperty(tokens, h); });
      JSON.stringify(acc)
    ]]
  ]
  $!mutex[release;access;$get[lock]]
  $if[$get[removed]==0;$return[missing]]
  $!accessLog[$get[actor];token-revoke;$get[target];$get[removed] token(s)]
  $return[ok]
  `,
});
