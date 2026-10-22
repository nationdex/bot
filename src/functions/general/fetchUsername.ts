import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'fetchUsername',
  // Returns the account username (never the display name) of any user id, fetching it from Discord when uncached.
  params: [
    {
      name: 'id',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $return[$js[
    (async () => {
      const id = String(ctx.getEnvironmentKey('id') || '').trim()
      if (!id) return 'unknown'
      const cached = ctx.client.users.cache.get(id)
      if (cached && cached.username) return cached.username
      const user = await ctx.client.users.fetch(id).catch(() => null)
      return user && user.username ? user.username : 'unknown'
    })()
  ]]
  `,
});
