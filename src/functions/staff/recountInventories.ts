import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'recountInventories',
  // Rebuilds the counters (totals, class counts, uniques, value) of inventories from the catches they hold. scope owners recounts everyone who owns a nation, scope users recounts a JSON array of user ids. Returns how many were recounted.
  params: [
    {
      name: 'scope',
      // owners or users
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // A nation id for owners, a JSON array of user ids for users
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[catalog;$getGlobalVar[collectiblesData]]
  $if[$env[scope]==owners;$jsonLoad[all;$searchDB[userCollectibles]]]
  $jsonLoad[list;$js[
    if (String(ctx.getEnvironmentKey('scope')) === 'owners') {
      const nation = String(ctx.getEnvironmentKey('value'));
      JSON.stringify(ctx.getEnvironmentKey('all').filter((row) => (JSON.parse(row.value || 'null') || {}).unique?.map(String).includes(nation)).map((row) => String(row.id)))
    } else {
      JSON.stringify(JSON.parse(String(ctx.getEnvironmentKey('value')) || 'null') || new Array())
    }
  ]]
  $let[done;0]
  $arrayForEach[list;uid;
    $let[lock;$mutex[acquire;inv:$env[uid]]]
    $let[inv;$getUserVar[userCollectibles;$env[uid]]]
    $setUserVar[userCollectibles;$js[(async () => {
      const db = ctx.client.db;
      const inv = JSON.parse(ctx.getKeyword('inv') || 'null') || {};
      const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
      const collectibles = catalog.collectibles || {};
      const ids = (inv.collectibleIDs || new Array()).map(String);
      const byId = new Map();
      if (ids.length) {
        const identifiers = ids.map((id) => db.make_intetifier({ type: 'old', name: 'collectible', id: id }));
        const marks = identifiers.map((x, i) => '$' + (i + 1)).join(',');
        const res = await db.pg.query('SELECT identifier, value FROM record WHERE identifier IN (' + marks + ')', identifiers);
        const byIdentifier = new Map(res.rows.map((r) => new Array(r.identifier, r.value)));
        ids.forEach((id, i) => {
          const v = byIdentifier.get(identifiers.at(i));
          if (v) byId.set(id, JSON.parse(v));
        });
      }
      const next = { total: 0, total_value: 0, unique: new Array(), collectibleIDs: new Array() };
      (catalog.classes || new Array()).forEach((c) => Reflect.set(next, c, 0));
      const unique = new Set();
      ids.forEach((cid) => {
        const row = byId.get(cid);
        const nation = row ? Reflect.get(collectibles, String(row.id)) : null;
        if (!nation) return;
        next.collectibleIDs.push(cid);
        next.total += 1;
        next.total_value += Number(nation.weight) || 0;
        Reflect.set(next, nation.class, (Number(Reflect.get(next, nation.class)) || 0) + 1);
        unique.add(String(row.id));
      });
      next.unique = Array.from(unique);
      return JSON.stringify(next);
    })()];$env[uid]]
    $!mutex[release;inv:$env[uid];$get[lock]]
    $letSum[done;1]
  ]
  $return[$get[done]]
  `,
});
