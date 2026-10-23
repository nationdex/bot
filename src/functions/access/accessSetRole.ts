import { ForgeFunction } from '@tryforge/forgescript';
import { accessCapabilities } from '../../config/access';
export default new ForgeFunction({
  name: 'accessSetRole',
  // Creates or replaces a role from a comma separated capability list. Returns a status.
  params: [
    {
      name: 'name',
      // The role name
      type: 'String',
      required: true,
    },
    {
      name: 'capabilities',
      // Comma separated capabilities
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[actor;$authorID]
  $let[name;$trim[$env[name]]]
  $if[$hasCap[$get[actor];access.manage]==false;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $let[nameOk;$js[
    const n = ctx.getKeyword('name');
    const first = 'abcdefghijklmnopqrstuvwxyz';
    n.length >= 2 && n.length <= 32 && first.includes(n.charAt(0)) && n.split('').every((c) => (first + '0123456789_-').includes(c))
  ]]
  $if[$get[nameOk]==false;$return[invalid]]
  $if[$get[name]==owner;$return[protected]]
  $let[caps;$js[
    const known = '${accessCapabilities.join(',')}'.split(',');
    const list = Array.from(new Set(String(ctx.getEnvironmentKey('capabilities')).split(',').map((c) => c.trim()).filter((c) => c)));
    const valid = (c) => c === '*' || known.includes(c) || (c.endsWith('.*') && known.some((k) => k.startsWith(c.slice(0, -1))));
    list.length > 0 && list.every(valid) ? JSON.stringify(list) : ''
  ]]
  $if[$get[caps]==;$return[unknown]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[caps]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]
  $let[lock;$mutex[acquire;access]]
  $let[acc;$getGlobalVar[access]]
  $setGlobalVar[access;$js[
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    acc.roles = acc.roles || {};
    Reflect.set(acc.roles, ctx.getKeyword('name'), JSON.parse(ctx.getKeyword('caps')));
    JSON.stringify(acc)
  ]]
  $!mutex[release;access;$get[lock]]
  $!accessLog[$get[actor];role-set;;$get[name]: $get[caps]]
  $if[$accessSensitive[$get[caps]];
    $!accessNotify[Role \`$get[name]\` was changed by \`$fetchUsername[$get[actor]]\`: $get[caps].]
  ]
  $return[ok]
  `,
});
