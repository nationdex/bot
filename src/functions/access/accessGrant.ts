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
  $let[sub;$accessSubject[$get[subj]]]
  $if[$get[sub]==;$return[unknown]]
  $let[needed;$js[JSON.stringify(JSON.parse(ctx.getKeyword('sub')).caps)]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[needed]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]

  $let[lock;$mutex[acquire;ua:$get[target]]]
  $let[ua;$getUserVar[userAccess;$get[target]]]
  $let[expires;$js[Number(ctx.getEnvironmentKey('hours')) > 0 ? Date.now() + Number(ctx.getEnvironmentKey('hours')) * 3600000 : 0]]
  $setUserVar[userAccess;$js[
    const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
    const sub = JSON.parse(ctx.getKeyword('sub'));
    const subject = ctx.getKeyword('subj');
    ua.grants = (ua.grants || new Array()).filter((g) => g.subject !== subject);
    ua.grants.push({ subject: subject, kind: sub.kind, expires: Number(ctx.getKeyword('expires')), by: ctx.getKeyword('actor'), at: Date.now(), reason: String(ctx.getEnvironmentKey('reason') || '').replace(/^null$/, '').slice(0, 200) });
    JSON.stringify(ua)
  ];$get[target]]
  $!mutex[release;ua:$get[target];$get[lock]]
  $!accessLog[$get[actor];grant;$get[target];$get[subj]]
  $if[$accessSensitive[$get[needed]];
    $!accessNotify[Access granted: \`$fetchUsername[$get[actor]]\` gave \`$get[subj]\` to \`$fetchUsername[$get[target]]\`$if[$get[expires]!=0; until <t:$floor[$divide[$get[expires];1000]]:f>].]
  ]
  $return[ok]
  `,
});
