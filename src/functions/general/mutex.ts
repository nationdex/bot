import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'mutex',
  // Named process-wide mutex for read-modify-write sections. acquire returns a token (empty when still busy after 8 seconds), release frees it.
  params: [
    {
      name: 'action',
      // acquire or release
      type: 'String',
      required: true,
    },
    {
      name: 'name',
      // The lock name, e.g. access, catalog or inv:<user id>
      type: 'String',
      required: true,
    },
    {
      name: 'token',
      // The token returned by acquire, needed to release
      type: 'String',
      required: false,
    },
  ],
  code: `
  $return[$js[
    (async () => {
      const g = globalThis
      if (!g.__ndxLocks) g.__ndxLocks = new Map()
      const locks = g.__ndxLocks
      const name = String(ctx.getEnvironmentKey('name'))
      if (String(ctx.getEnvironmentKey('action')) === 'release') {
        const held = locks.get(name)
        if (held && held.token === String(ctx.getEnvironmentKey('token'))) locks.delete(name)
        return 'true'
      }
      const started = Date.now()
      while (Date.now() - started < 8000) {
        const held = locks.get(name)
        if (!held || Date.now() - held.at > 30000) {
          const t = Math.random().toString(36).slice(2) + Date.now().toString(36)
          locks.set(name, { token: t, at: Date.now() })
          return t
        }
        await new Promise((r) => setTimeout(r, 10))
      }
      return ''
    })()
  ]]
  `,
});
