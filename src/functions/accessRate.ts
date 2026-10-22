import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessRate',
  // Counts one access mutation for the user and returns rate once they exceed 20 per minute.
  params: [
    {
      name: 'actor',
      // The acting user id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[ua;$getUserVar[userAccess;$env[actor]]]
  $let[next;$js[
    const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
    const now = Date.now();
    const w = ua.window || { start: 0, count: 0 };
    if (now - w.start > 60000) { w.start = now; w.count = 0; }
    w.count += 1;
    ua.window = w;
    JSON.stringify(ua)
  ]]
  $setUserVar[userAccess;$get[next];$env[actor]]
  $return[$js[JSON.parse(ctx.getKeyword('next')).window.count <= 20 ? 'ok' : 'rate']]
  `,
});
