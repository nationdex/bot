import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessOwners',
  // Returns the ids of every user holding an active owner level grant, as a JSON array.
  params: [
  ],
  code: `
  $let[rows;$searchDB[userAccess;;;]]
  $let[acc;$accessData]
  $return[$js[
    const rows = JSON.parse(ctx.getKeyword('rows') || 'null') || new Array();
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    const roles = acc.roles || {};
    const now = Date.now();
    const owners = rows.filter((r) => {
      const ua = JSON.parse(r.value || 'null') || {};
      return (ua.grants || new Array()).some((g) => (!g.expires || g.expires > now) && (g.kind === 'role' ? (Reflect.get(roles, g.subject) || new Array()).includes('*') : g.subject === '*'));
    }).map((r) => r.id);
    JSON.stringify(owners)
  ]]
  `,
});
