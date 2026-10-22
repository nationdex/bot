import { ForgeFunction } from '@tryforge/forgescript';
import { accessCapabilities } from '../../config/access';
export default new ForgeFunction({
  name: 'accessList',
  // Describes the grants of a user, or the roles when no user is given. Requires access.manage.
  params: [
    {
      name: 'user',
      // The user id, or empty for the roles
      type: 'String',
      required: false,
    },
  ],
  code: `
  $if[$hasCap[$authorID;access.manage]==false;$return[denied]]
  $let[target;$replace[$env[user];null;]]
  $let[acc;$getGlobalVar[access]]
  $let[ua;$if[$get[target]==;;$getUserVar[userAccess;$get[target]]]]
  $return[$js[(async () => {
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    const target = ctx.getKeyword('target');
    const nl = String.fromCharCode(10);
    const tick = String.fromCharCode(96);
    const code = (v) => tick + v + tick;
    const name = async (id) => {
      const u = await ctx.client.users.fetch(id).catch(() => null);
      return u && u.username ? u.username : 'unknown';
    };
    const stamp = (ms) => ms ? '<t:' + Math.floor(ms / 1000) + ':R>' : 'never';
    if (!target) {
      const known = '${accessCapabilities.join(',')}'.split(',');
      const lines = Object.entries(acc.roles || {}).map((e) => '- ' + code(e.at(0)) + ': ' + e.at(1).map(code).join(', '));
      return '**Roles**' + nl + lines.join(nl) + nl + nl + '**Capabilities**' + nl + known.map(code).join(', ');
    }
    const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
    const grants = ua.grants || new Array();
    const who = await name(target);
    if (!grants.length) return code(who) + ' has no access grants.';
    const lines = await Promise.all(grants.map(async (g) => '- ' + code(g.subject) + ' (' + g.kind + ')' + (g.expires && g.expires <= Date.now() ? ' **expired**' : '') + ' · expires ' + stamp(g.expires) + ' · by ' + code(await name(g.by))));
    return '**Access for ' + code(who) + '**' + nl + lines.join(nl);
  })()]]
  `,
});
