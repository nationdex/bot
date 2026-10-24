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
    $let[ua;$getUserVar[userAccess;$get[actor]]]
    $setUserVar[userAccess;$js[
      const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
      ua.grants = (ua.grants || new Array()).filter((g) => g.subject !== 'owner');
      ua.grants.push({ subject: 'owner', kind: 'role', expires: 0, by: ctx.getKeyword('actor'), at: Date.now(), reason: 'claimed as application owner' });
      JSON.stringify(ua)
    ];$get[actor]]
    $!mutex[release;ua:$get[actor];$get[uaLock]]
  ]
  $!mutex[release;claim;$get[lock]]
  $if[$get[state]==ok;$!accessLog[$get[actor];claim;$get[actor];application owner]]
  $if[$get[state]==not_app_owner;$!accessLog[$get[actor];claim-denied;;not the application owner]]
  $return[$get[state]]
  `,
});
