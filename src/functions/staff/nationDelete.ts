import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'nationDelete',
  // Deletes a nation from the catalog. With cascade it also removes every catch of it and recounts the owners.
  params: [
    {
      name: 'id',
      // The nation id
      type: 'String',
      required: true,
    },
    {
      name: 'body',
      // The JSON request body; cascade true also removes every catch of the nation
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[lock;$mutex[acquire;catalog]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[house;$getGlobalVar[auctionHouse]]
  $jsonLoad[rows;$searchDB[collectible]]
  $let[plan;$js[(() => {
    const id = String(ctx.getEnvironmentKey('id'));
    const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
    const nation = Reflect.get(catalog.collectibles || {}, id);
    if (!nation) return JSON.stringify({ status: 400, error: 'That nation no longer exists.' });
    const house = JSON.parse(ctx.getKeyword('house') || 'null') || {};
    if (Object.values(house.auctions || {}).some((a) => a && String(a.colID) === id)) return JSON.stringify({ status: 400, error: 'Active auctions hold this nation. Cancel them first.' });
    const mine = ctx.getEnvironmentKey('rows').map((r) => ({ catchId: r.id, data: JSON.parse(r.value || 'null') || {} })).filter((c) => String(c.data.id) === id);
    let cascade = false;
    try { cascade = (JSON.parse(String(ctx.getEnvironmentKey('body') ?? '').replace(/^null$/, '') || 'null') || {}).cascade === true; } catch (e) { return JSON.stringify({ status: 400, error: 'The body is not valid JSON.' }); }
    if (mine.length && !cascade) return JSON.stringify({ status: 400, error: mine.length + ' catch(es) of this nation exist. Send cascade true to remove them too.', value: { catches: mine.length } });
    Reflect.deleteProperty(catalog.collectibles, id);
    catalog.total = Object.keys(catalog.collectibles).length;
    Reflect.set(catalog, nation.class, Math.max((Number(Reflect.get(catalog, nation.class)) || 0) - 1, 0));
    return JSON.stringify({ status: 200, value: { catches: mine.length }, catalog: catalog, ids: mine.map((c) => c.catchId), owners: Array.from(new Set(mine.map((c) => String(c.data.author)))) });
  })()]]
  $jsonLoad[p;$get[plan]]
  $if[$env[p;status]!=200;
    $!mutex[release;catalog;$get[lock]]
    $return[$get[plan]]
  ]
  $jsonLoad[ids;$env[p;ids]]
  $let[ownersJson;$js[JSON.stringify(JSON.parse(ctx.getKeyword('plan')).owners)]]
  $arrayForEach[ids;cid;$!deleteVar[collectible;$env[cid]]]
  $setGlobalVar[collectiblesData;$js[JSON.stringify(JSON.parse(ctx.getKeyword('plan')).catalog)]]
  $!mutex[release;catalog;$get[lock]]
  $!recountInventories[users;$get[ownersJson]]
  $return[$js[JSON.stringify({ status: 200, value: JSON.parse(ctx.getKeyword('plan')).value })]]
  `,
});
