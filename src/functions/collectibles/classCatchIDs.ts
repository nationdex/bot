import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'classCatchIDs',
  // Filters user catch IDs by rarity class in a batch DB lookup.
  params: [
    {
      name: 'ids',
      // JSON array of raw catch (collectible instance) IDs to filter.
      type: 'String',
      required: true,
    },
    {
      name: 'catalog',
      // JSON string of the full catalog object (must contain .collectibles).
      type: 'String',
      required: true,
    },
    {
      name: 'class',
      // The rarity class to filter for.
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
      if (!Array.isArray(ids) || ids.length === 0) return JSON.stringify(new Array())

      let catalog = null
      if (rawCatalog) {
        try { catalog = JSON.parse(rawCatalog) } catch (e) { catalog = null }
      }
      const collectibles = catalog && catalog.collectibles ? catalog.collectibles : {}

      const db = ctx.client.db
      const identifiers = ids.map(id => db.make_intetifier({ type: 'old', name: 'collectible', id: String(id) }))
      const placeholders = identifiers.map((identifier, i) => '$' + (i + 1)).join(',')
      const res = await db.pg.query('SELECT identifier, value FROM record WHERE identifier IN (' + placeholders + ')', identifiers)

      const byIdentifier = new Map()
      for (const row of res.rows) byIdentifier.set(row.identifier, row.value)

      const out = new Array()
      ids.forEach((id, i) => {
        const identifier = identifiers.at(i)
        const value = byIdentifier.get(identifier)
        if (!value) return
        let catalogId
        try { catalogId = JSON.parse(value).id } catch (e) { return }
        const entry = Reflect.get(collectibles, catalogId)
        if (entry && entry.class === targetClass) out.push(id)
      })
      return JSON.stringify(out)
    })()
  ]]
  `,
});
