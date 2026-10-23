import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessDeleteRole',
  // Deletes a role and every grant of it. Returns a status.
  params: [
    {
      name: 'name',
      // The role name
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[actor;$authorID]
  $let[name;$trim[$env[name]]]
  $if[$hasCap[$get[actor];access.manage]==false;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $if[$get[name]==owner;$return[protected]]
  $let[acc;$accessData]
  $let[caps;$js[const r = Reflect.get((JSON.parse(ctx.getKeyword('acc') || 'null') || {}).roles || {}, ctx.getKeyword('name')); r ? JSON.stringify(r) : '']]
  $if[$get[caps]==;$return[missing]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[caps]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]
  $let[lock;$mutex[acquire;access]]
  $let[acc;$accessData]
  $setGlobalVar[access;$js[
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    Reflect.deleteProperty(acc.roles || {}, ctx.getKeyword('name'));
    acc.removedRoles = Array.from(new Set((acc.removedRoles || new Array()).concat(ctx.getKeyword('name'))));
    JSON.stringify(acc)
  ]]
  $!mutex[release;access;$get[lock]]
  $jsonLoad[rows;$searchDB[userAccess]]
  $arrayForEach[rows;row;
    $let[uid;$env[row;id]]
    $let[rowLock;$mutex[acquire;ua:$get[uid]]]
    $let[ua;$getUserVar[userAccess;$get[uid]]]
    $setUserVar[userAccess;$js[
      const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
      ua.grants = (ua.grants || new Array()).filter((g) => !(g.kind === 'role' && g.subject === ctx.getKeyword('name')));
      JSON.stringify(ua)
    ];$get[uid]]
    $!mutex[release;ua:$get[uid];$get[rowLock]]
  ]
  $!accessLog[$get[actor];role-delete;;$get[name]]
  $!accessNotify[Role \`$get[name]\` was deleted by \`$fetchUsername[$get[actor]]\`.]
  $return[ok]
  `,
});
