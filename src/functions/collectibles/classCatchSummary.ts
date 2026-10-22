import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'classCatchSummary',
  // One batched DB read returning the user's catch count per rarity class plus the catch IDs of one class.
  params: [
    {
      name: 'ids',
      // JSON array of raw catch (collectible instance) IDs.
      type: 'String',
      required: true,
    },
    {
      name: 'catalog',
      // JSON string of the full catalog object (must contain .collectibles and .classes).
      type: 'String',
      required: true,
    },
    {
      name: 'class',
      // The class whose catch IDs to return.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $return[$js[
    (async () => {
      const rawIds = ctx.getEnvironmentKey('ids')
      const rawCatalog = ctx.getEnvironmentKey('catalog')
      const targetClass = String(ctx.getEnvironmentKey('class') || '')

      let ids = new Array()
      if (rawIds) {
        try { ids = JSON.parse(rawIds) } catch (e) { ids = new Array() }
      }
      let catalog = null
      if (rawCatalog) {
        try { catalog = JSON.parse(rawCatalog) } catch (e) { catalog = null }
      }
      const collectibles = catalog && catalog.collectibles ? catalog.collectibles : {}
      const classes = catalog && Array.isArray(catalog.classes) ? catalog.classes : new Array()

      const counts = new Object()
      classes.forEach((c) => Reflect.set(counts, c, 0))
      const out = new Array()
      if (!Array.isArray(ids) || ids.length === 0) return JSON.stringify({ counts: counts, ids: out })

      const db = ctx.client.db
      const identifiers = ids.map(id => db.make_intetifier({ type: 'old', name: 'collectible', id: String(id) }))
      const placeholders = identifiers.map((identifier, i) => '$' + (i + 1)).join(',')
      const res = await db.pg.query('SELECT identifier, value FROM record WHERE identifier IN (' + placeholders + ')', identifiers)

      const byIdentifier = new Map()
      for (const row of res.rows) byIdentifier.set(row.identifier, row.value)

      ids.forEach((id, i) => {
        const value = byIdentifier.get(identifiers.at(i))
        if (!value) return
        let catalogId
        try { catalogId = JSON.parse(value).id } catch (e) { return }
        const entry = Reflect.get(collectibles, catalogId)
        if (!entry) return
        Reflect.set(counts, entry.class, (Reflect.get(counts, entry.class) || 0) + 1)
        if (entry.class === targetClass) out.push(id)
      })
      return JSON.stringify({ counts: counts, ids: out })
    })()
  ]]
  `,
});
