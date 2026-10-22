import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'recountUser',
  // Rebuilds the counters of a user inventory (totals, class counts, uniques, value) from the catches it holds.
  params: [
    {
      name: 'user',
      // The user id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[inv;$getUserVar[userCollectibles;$env[user]]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $jsonLoad[rows;$searchDB[collectible]]
  $setUserVar[userCollectibles;$js[
    const inv = JSON.parse(ctx.getKeyword('inv') || 'null') || {};
    const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
    const collectibles = catalog.collectibles || {};
    const byId = new Map(ctx.getEnvironmentKey('rows').map((r) => new Array(r.id, JSON.parse(r.value || 'null') || {})));
    const next = { total: 0, total_value: 0, unique: new Array(), collectibleIDs: new Array() };
    (catalog.classes || new Array()).forEach((c) => Reflect.set(next, c, 0));
    const unique = new Set();
    (inv.collectibleIDs || new Array()).map(String).forEach((cid) => {
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
    JSON.stringify(next)
  ];$env[user]]
  `,
});
