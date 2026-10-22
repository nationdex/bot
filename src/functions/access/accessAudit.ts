import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessAudit',
  // Lists the most recent access audit entries. Requires access.manage.
  params: [
    {
      name: 'limit',
      // Maximum entries
      type: 'String',
      required: false,
    },
  ],
  code: `
  $if[$hasCap[$authorID;access.manage]==false;$return[denied]]
  $let[log;$getGlobalVar[accessAudit]]
  $return[$js[(async () => {
    const list = JSON.parse(ctx.getKeyword('log') || 'null') || new Array();
    const n = Math.min(Math.max(parseInt(String(ctx.getEnvironmentKey('limit')), 10) || 10, 1), 25);
    if (!list.length) return 'No audit entries.';
    const nl = String.fromCharCode(10);
    const tick = String.fromCharCode(96);
    const code = (v) => tick + v + tick;
    const name = async (id) => {
      const u = await ctx.client.users.fetch(id).catch(() => null);
      return u && u.username ? u.username : 'unknown';
    };
    const lines = await Promise.all(list.slice(0, n).map(async (e) => '- <t:' + Math.floor(e.at / 1000) + ':R> ' + code(await name(e.actor)) + ' **' + e.action + '**' + (e.target ? ' -> ' + code(await name(e.target)) : '') + (e.detail ? ' · ' + String(e.detail).slice(0, 120) : '')));
    return '**Recent access audit**' + nl + lines.join(nl);
  })()]]
  `,
});
