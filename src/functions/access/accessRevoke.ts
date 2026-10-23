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
  $let[ua;$getUserVar[userAccess;$get[target]]]
  $let[has;$js[(JSON.parse(ctx.getKeyword('ua') || 'null') || {}).grants?.some((g) => g.subject === ctx.getKeyword('subj')) === true]]
  $if[$get[has]==false;$return[missing]]
  $let[sub;$accessSubject[$get[subj]]]
  $let[needed;$js[ctx.getKeyword('sub') ? JSON.stringify(JSON.parse(ctx.getKeyword('sub')).caps) : JSON.stringify(new Array())]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[needed]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]
  $let[owners;$accessOwners]
  $let[lastOwner;$js[JSON.parse(ctx.getKeyword('needed')).includes('*') && JSON.parse(ctx.getKeyword('owners')).filter((id) => id !== ctx.getKeyword('target')).length === 0]]
  $if[$get[lastOwner];$return[last_owner]]
  $let[lock;$mutex[acquire;ua:$get[target]]]
  $let[ua;$getUserVar[userAccess;$get[target]]]
  $setUserVar[userAccess;$js[
    const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
    ua.grants = (ua.grants || new Array()).filter((g) => g.subject !== ctx.getKeyword('subj'));
    JSON.stringify(ua)
  ];$get[target]]
  $!mutex[release;ua:$get[target];$get[lock]]
  $!accessLog[$get[actor];revoke;$get[target];$get[subj]]
  $if[$accessSensitive[$get[needed]];
    $!accessNotify[Access revoked: \`$fetchUsername[$get[actor]]\` removed \`$get[subj]\` from \`$fetchUsername[$get[target]]\`.]
  ]
  $return[ok]
  `,
});
