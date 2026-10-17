import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionLock',
  // Process-wide auction mutex. acquire returns a token (empty when busy), release frees it.
  params: [
    {
      name: 'action',
      type: 'String',
      required: true,
    },
    {
      name: 'token',
      type: 'String',
      required: false,
    },
  ],
  code: `
  $return[$js[
    (async () => {
      const g = globalThis
      const action = String(ctx.getEnvironmentKey('action'))
      const token = String(ctx.getEnvironmentKey('token'))
      if (action === 'release') {
        const held = g.__ndxAuctionLock
        if (held && held.token === token) g.__ndxAuctionLock = undefined
        return 'true'
      }
      const started = Date.now()
      while (Date.now() - started < 8000) {
        const held = g.__ndxAuctionLock
        if (!held || Date.now() - held.at > 30000) {
          const t = Math.random().toString(36).slice(2) + Date.now().toString(36)
          g.__ndxAuctionLock = { token: t, at: Date.now() }
          return t
        }
        await new Promise((r) => setTimeout(r, 25))
      }
      return ''
    })()
  ]]
  `,
});
