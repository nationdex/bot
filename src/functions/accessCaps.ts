import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessCaps',
  // Returns the active capabilities of a user as a JSON array: unexpired grants with roles expanded.
  params: [
    {
      name: 'user',
      // The user id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[ua;$getUserVar[userAccess;$env[user]]]
  $let[acc;$getGlobalVar[access]]
  $return[$js[
    const ua = JSON.parse(ctx.getKeyword('ua') || 'null') || {};
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    const roles = acc.roles || {};
    const now = Date.now();
    const out = new Set();
    (ua.grants || new Array()).forEach((g) => {
      if (g.expires && g.expires <= now) return;
      if (g.kind === 'role') (Reflect.get(roles, g.subject) || new Array()).forEach((c) => out.add(c));
      else out.add(g.subject);
    });
    JSON.stringify(Array.from(out))
  ]]
  `,
});
