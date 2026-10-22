import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessClaim',
  // Claims ownership for the verified Discord application owner while no owner exists. Returns a status.
  params: [
  ],
  code: `
  $let[actor;$authorID]
  $let[home;$js[process.env.HOME_GUILD_ID || '']]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $jsonLoad[owners;$accessOwners]
  $if[$arrayLength[owners]>0;$return[claimed]]
  $if[$botOwnerID!=$get[actor];
    $!accessLog[$get[actor];claim-denied;;not the application owner]
    $return[not_app_owner]
  ]
  $let[ua;$getUserVar[userAccess;$get[actor]]]
  $setUserVar[userAccess;$js[
    const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
    ua.grants = (ua.grants || new Array()).filter((g) => g.subject !== 'owner');
    ua.grants.push({ subject: 'owner', kind: 'role', expires: 0, by: ctx.getKeyword('actor'), at: Date.now(), reason: 'claimed as application owner' });
    JSON.stringify(ua)
  ];$get[actor]]
  $!accessLog[$get[actor];claim;$get[actor];application owner]
  $return[ok]
  `,
});
