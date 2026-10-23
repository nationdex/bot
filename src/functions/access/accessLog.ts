import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessLog',
  // Appends an entry to the access audit log (newest first, capped at 300).
  params: [
    {
      name: 'actor',
      // The acting user id
      type: 'String',
      required: true,
    },
    {
      name: 'action',
      // The action name
      type: 'String',
      required: true,
    },
    {
      name: 'target',
      // The target id
      type: 'String',
      required: false,
    },
    {
      name: 'detail',
      // Free text detail
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[lock;$mutex[acquire;audit]]
  $let[log;$getGlobalVar[accessAudit]]
  $setGlobalVar[accessAudit;$js[
    const list = JSON.parse(ctx.getKeyword('log') || 'null') || new Array();
    const clean = (v) => String(v === undefined || v === null || v === 'null' ? '' : v).slice(0, 300);
    list.unshift({ actor: clean(ctx.getEnvironmentKey('actor')), action: clean(ctx.getEnvironmentKey('action')), target: clean(ctx.getEnvironmentKey('target')), detail: clean(ctx.getEnvironmentKey('detail')), at: Date.now() });
    JSON.stringify(list.slice(0, 300))
  ]]
  $!mutex[release;audit;$get[lock]]
  `,
});
